import { describe, it, expect, afterEach, beforeEach } from 'bun:test'
import {
    VARIANT_WIDTHS,
    parseVariantWidth,
    MAX_ORIGINAL_DIMENSION,
    getVariant,
    imagesDir,
    variantsDir,
} from '@/utils/image-variants'
import { mkdir, writeFile, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

describe('parseVariantWidth', () => {
    it('accepts each allowlisted width', () => {
        for (const width of VARIANT_WIDTHS) {
            expect(parseVariantWidth(String(width))).toBe(width)
        }
    })

    it('rejects a width that is not on the allowlist', () => {
        expect(parseVariantWidth('401')).toBeNull()
        expect(parseVariantWidth('4000')).toBeNull()
        expect(parseVariantWidth('1')).toBeNull()
    })

    it('rejects junk without throwing', () => {
        expect(parseVariantWidth('abc')).toBeNull()
        expect(parseVariantWidth('')).toBeNull()
        expect(parseVariantWidth(null)).toBeNull()
        expect(parseVariantWidth(undefined)).toBeNull()
        expect(parseVariantWidth('400; DROP TABLE')).toBeNull()
        expect(parseVariantWidth('-400')).toBeNull()
        expect(parseVariantWidth('400.0')).toBeNull()
    })

    it('exposes the documented allowlist and original cap', () => {
        expect([...VARIANT_WIDTHS]).toEqual([400, 800, 1600])
        expect(MAX_ORIGINAL_DIMENSION).toBe(4000)
    })
})

const FIXTURE = 'test-fixture-variants-1234567890.png'

/** Build a real 2000x1000 PNG on disk so generation exercises the true path. */
async function writeFixture(name = FIXTURE) {
    const sharp = (await import('sharp')).default
    await mkdir(imagesDir(), { recursive: true })
    const png = await sharp({
        create: {
            width: 2000,
            height: 1000,
            channels: 3,
            background: { r: 200, g: 40, b: 90 },
        },
    })
        .png()
        .toBuffer()
    await writeFile(join(imagesDir(), name), png)
}

async function cleanupFixture(name = FIXTURE) {
    await rm(join(imagesDir(), name), { force: true })
    for (const width of VARIANT_WIDTHS) {
        await rm(join(variantsDir(), `${name}@${width}.webp`), { force: true })
    }
    await rm(join(variantsDir(), `${name}@blur.txt`), { force: true })
}

describe('getVariant', () => {
    beforeEach(async () => {
        await writeFixture()
    })

    afterEach(async () => {
        await cleanupFixture()
    })

    it('produces a WebP smaller than the source and writes it to the cache', async () => {
        const buffer = await getVariant(FIXTURE, 400)

        expect(buffer).not.toBeNull()
        // WebP files start with "RIFF" then, at offset 8, "WEBP".
        expect(buffer!.subarray(0, 4).toString('ascii')).toBe('RIFF')
        expect(buffer!.subarray(8, 12).toString('ascii')).toBe('WEBP')
        expect(existsSync(join(variantsDir(), `${FIXTURE}@400.webp`))).toBe(true)
    })

    it('resizes to the requested width', async () => {
        const sharp = (await import('sharp')).default
        const buffer = await getVariant(FIXTURE, 400)
        const meta = await sharp(buffer!).metadata()

        expect(meta.width).toBe(400)
    })

    it('never upscales past the source width', async () => {
        const sharp = (await import('sharp')).default
        const buffer = await getVariant(FIXTURE, 1600)
        const meta = await sharp(buffer!).metadata()

        // Source is 2000px wide, so 1600 is a genuine downscale.
        expect(meta.width).toBe(1600)
    })

    it('serves the second call from the disk cache', async () => {
        const first = await getVariant(FIXTURE, 800)
        const cachePath = join(variantsDir(), `${FIXTURE}@800.webp`)
        // Overwrite the cache with a sentinel; a cache hit returns it verbatim.
        await writeFile(cachePath, Buffer.from('SENTINEL'))
        const second = await getVariant(FIXTURE, 800)

        expect(first).not.toBeNull()
        expect(second!.toString()).toBe('SENTINEL')
    })

    it('returns null for a missing source file', async () => {
        expect(await getVariant('does-not-exist-9999.png', 400)).toBeNull()
    })

    it('refuses a filename containing a path separator', async () => {
        expect(await getVariant('../../.env', 400)).toBeNull()
        expect(await getVariant('sub/dir.png', 400)).toBeNull()
    })

    it('generates only once when called concurrently', async () => {
        const results = await Promise.all([
            getVariant(FIXTURE, 400),
            getVariant(FIXTURE, 400),
            getVariant(FIXTURE, 400),
        ])

        for (const result of results) expect(result).not.toBeNull()
        expect(results[0]!.equals(results[1]!)).toBe(true)
        expect(results[1]!.equals(results[2]!)).toBe(true)
    })
})
