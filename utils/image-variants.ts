import { join } from 'path'
import type { Sharp } from 'sharp'
import { existsSync } from 'fs'
import { mkdir, readFile, writeFile, rm } from 'fs/promises'
import { basename } from 'path'

/**
 * Widths, in pixels, that a caller may request a derivative at.
 *
 * This is an allowlist rather than a range on purpose: `?w=` comes straight off
 * a URL, and an open parameter would let anyone fill the disk by requesting ten
 * thousand slightly different sizes.
 */
export const VARIANT_WIDTHS = [400, 800, 1600] as const

export type VariantWidth = (typeof VARIANT_WIDTHS)[number]

/** WebP quality for generated derivatives. */
export const VARIANT_QUALITY = 78

/** Width, in pixels, of the inline blur placeholder. */
export const BLUR_WIDTH = 16

/** WebP quality for the blur placeholder. Low on purpose - it is 16px wide. */
export const BLUR_QUALITY = 40

/**
 * Longest edge, in pixels, that a stored original may have. Anything larger is
 * downscaled once at upload time. 4000px is far beyond any display size on the
 * site (the largest derivative is 1600px), so this is still "the high-res
 * version" for any practical purpose, while keeping a 200MB phone photo from
 * occupying 200MB of the deploy host's disk forever.
 */
export const MAX_ORIGINAL_DIMENSION = 4000

/** Absolute path to the uploaded-images directory. */
export function imagesDir(): string {
    return join(process.cwd(), 'uploads', 'images')
}

/**
 * Absolute path to the derivative cache.
 *
 * A dotted subdirectory of uploads/images. The static route sanitises filenames
 * with basename() before touching disk, so nothing under here is reachable as a
 * direct URL - derivatives are only ever served through an allowlisted `?w=`.
 */
export function variantsDir(): string {
    return join(imagesDir(), '.variants')
}

/**
 * Parse a `?w=` query value into an allowlisted width.
 *
 * Returns null for anything not exactly matching an allowlisted value, so the
 * caller can fall back to serving the untouched original.
 */
export function parseVariantWidth(
    raw: string | null | undefined,
): VariantWidth | null {
    if (!raw) return null
    if (!/^\d+$/.test(raw)) return null
    const parsed = Number(raw)
    return (VARIANT_WIDTHS as readonly number[]).includes(parsed)
        ? (parsed as VariantWidth)
        : null
}

export type SharpFactory = (input: Buffer | string) => Sharp

let sharpModule: SharpFactory | null | undefined

/**
 * Load sharp lazily, tolerating its absence.
 *
 * sharp ships prebuilt native binaries that need a newer glibc than the OCF host
 * provides, so it is an optionalDependency. Every caller must handle `null` by
 * falling back to the original image rather than failing the request.
 *
 * Resolved once and cached; `null` means unavailable.
 */
export async function loadSharp(): Promise<SharpFactory | null> {
    if (sharpModule !== undefined) return sharpModule
    try {
        const mod = await import('sharp')
        sharpModule = (mod.default ?? mod) as unknown as SharpFactory
    } catch (error) {
        console.error(
            'sharp unavailable; serving original images without derivatives:',
            error,
        )
        sharpModule = null
    }
    return sharpModule
}

/**
 * In-flight generation promises, keyed by cache path.
 *
 * A page with six images fires six requests for the same derivative at once on a
 * cold cache. Without this, all six would decode and re-encode the same file.
 */
const inFlight = new Map<string, Promise<Buffer | null>>()

/**
 * Reject anything that is not a plain filename.
 *
 * The static route already sanitises with basename() before calling in; this is
 * defence in depth so the service is safe to call from a script or a future
 * caller that forgets.
 */
function safeName(filename: string): string | null {
    if (!filename) return null
    const base = basename(filename)
    if (base !== filename || base === '.' || base === '..') return null
    return base
}

/**
 * Return a WebP derivative of an uploaded image at the given width, generating
 * and caching it on first request.
 *
 * Returns null when the source does not exist, sharp is unavailable, or encoding
 * fails - the caller is expected to serve the untouched original in that case.
 */
export async function getVariant(
    filename: string,
    width: VariantWidth,
): Promise<Buffer | null> {
    const name = safeName(filename)
    if (!name) return null

    // VariantWidth is a TypeScript type erased at runtime, so enforce the allowlist here.
    // Without this check, a caller could pass a traversal string and write to arbitrary paths.
    if (!(VARIANT_WIDTHS as readonly number[]).includes(width as number)) return null

    const cachePath = join(variantsDir(), `${name}@${width}.webp`)

    if (existsSync(cachePath)) {
        try {
            return await readFile(cachePath)
        } catch {
            // Fall through and regenerate if the cached file is unreadable.
        }
    }

    const pending = inFlight.get(cachePath)
    if (pending) return pending

    const work = generateVariant(name, width, cachePath).finally(() => {
        inFlight.delete(cachePath)
    })
    inFlight.set(cachePath, work)
    return work
}

async function generateVariant(
    name: string,
    width: VariantWidth,
    cachePath: string,
): Promise<Buffer | null> {
    const sourcePath = join(imagesDir(), name)
    if (!existsSync(sourcePath)) return null

    const sharp = await loadSharp()
    if (!sharp) return null

    try {
        const buffer = await sharp(sourcePath)
            // Honour EXIF orientation before metadata is dropped, so portrait
            // photos do not come out sideways.
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: VARIANT_QUALITY })
            .toBuffer()

        await mkdir(variantsDir(), { recursive: true })
        await writeFile(cachePath, buffer)
        return buffer
    } catch (error) {
        console.error(`Failed to generate ${width}px variant of ${name}:`, error)
        return null
    }
}

/**
 * Memoised blur URIs, keyed by filename.
 *
 * Uploaded filenames are immutable (they carry an upload timestamp), so a value
 * cached here can never go stale. `null` is cached too, so a missing file does
 * not re-hit the disk on every render of a page that references it.
 */
const blurCache = new Map<string, string | null>()

/**
 * Return a tiny blurred preview of an uploaded image as a data URI, suitable for
 * inlining into server-rendered HTML as a placeholder.
 *
 * Roughly 300 bytes. Cached on disk and in memory. Returns null when the source
 * is missing or sharp is unavailable, in which case the caller renders without a
 * placeholder rather than failing.
 */
export async function getBlurDataUrl(filename: string): Promise<string | null> {
    const name = safeName(filename)
    if (!name) return null

    const cached = blurCache.get(name)
    if (cached !== undefined) return cached

    const value = await resolveBlurDataUrl(name)
    blurCache.set(name, value)
    return value
}

async function resolveBlurDataUrl(name: string): Promise<string | null> {
    const cachePath = join(variantsDir(), `${name}@blur.txt`)

    if (existsSync(cachePath)) {
        try {
            return (await readFile(cachePath, 'utf8')).trim() || null
        } catch {
            // Fall through and regenerate.
        }
    }

    const sourcePath = join(imagesDir(), name)
    if (!existsSync(sourcePath)) return null

    const sharp = await loadSharp()
    if (!sharp) return null

    try {
        const buffer = await sharp(sourcePath)
            .rotate()
            .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
            .webp({ quality: BLUR_QUALITY })
            .toBuffer()

        const uri = `data:image/webp;base64,${buffer.toString('base64')}`
        await mkdir(variantsDir(), { recursive: true })
        await writeFile(cachePath, uri, 'utf8')
        return uri
    } catch (error) {
        console.error(`Failed to generate blur placeholder for ${name}:`, error)
        return null
    }
}

/**
 * Generate every derivative for an image up front.
 *
 * Called after an upload so the first visitor is not the one paying to encode
 * four files. Deliberately swallows every failure: a missing derivative is a
 * slower page, not a broken one.
 */
export async function warmVariants(filename: string): Promise<void> {
    const name = safeName(filename)
    if (!name) return

    try {
        await Promise.all([
            ...VARIANT_WIDTHS.map(width => getVariant(name, width)),
            getBlurDataUrl(name),
        ])
    } catch (error) {
        console.error(`Failed to warm variants for ${name}:`, error)
    }
}

/**
 * Remove every derivative of an image. Called when the original is deleted so
 * the cache does not accumulate orphans.
 */
export async function deleteVariants(filename: string): Promise<void> {
    const name = safeName(filename)
    if (!name) return

    blurCache.delete(name)

    try {
        await Promise.all([
            ...VARIANT_WIDTHS.map(width =>
                rm(join(variantsDir(), `${name}@${width}.webp`), { force: true }),
            ),
            rm(join(variantsDir(), `${name}@blur.txt`), { force: true }),
        ])
    } catch (error) {
        console.error(`Failed to delete variants for ${name}:`, error)
    }
}
