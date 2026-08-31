import { join, dirname } from 'path'
import { mkdir, writeFile, rename, unlink } from 'fs/promises'

/**
 * Header set on outgoing fallback fetches (and checked on incoming requests)
 * so that two hosts which both lack a file cannot ping-pong forever - a
 * request that already came in via the fallback path never triggers another
 * fallback fetch.
 */
export const FALLBACK_GUARD_HEADER = 'x-uploads-no-fallback'

const TIMEOUT_MS = 15_000

/** Only these three upload types exist, each with a flat single-segment filename. */
const VALID_PUBLIC_PATH = /^\/(images|articles|pdfs)\/[^/]+$/

/**
 * Fetches a missing upload from the other host (`UPLOADS_FALLBACK_URL`) and
 * caches it to local disk, so each host converges toward a complete copy of
 * `uploads/` over time.
 *
 * `publicPath` is a path like `/images/file.jpg`, `/articles/file.docx`, or
 * `/pdfs/file.pdf` - the same shape stored in the database.
 *
 * Returns `null` (never throws) when: the env var is unset, the path fails
 * sanitization, the fetch fails or times out, or the response is not a 200.
 */
export async function fetchAndCacheUpload(
    publicPath: string,
): Promise<Buffer | null> {
    const fallbackUrl = process.env.UPLOADS_FALLBACK_URL
    if (!fallbackUrl) return null

    if (publicPath.includes('..') || !VALID_PUBLIC_PATH.test(publicPath)) {
        return null
    }

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

        let response: Response
        try {
            response = await fetch(`${fallbackUrl}${publicPath}`, {
                headers: { [FALLBACK_GUARD_HEADER]: '1' },
                signal: controller.signal,
            })
        } finally {
            clearTimeout(timeout)
        }

        if (!response.ok) return null

        const buffer = Buffer.from(await response.arrayBuffer())

        const destPath = join(process.cwd(), 'uploads', publicPath)
        await mkdir(dirname(destPath), { recursive: true })

        // Write via a temp file + rename so a concurrent request never reads
        // a half-written file.
        const tempPath = `${destPath}.tmp-${process.pid}-${Date.now()}`
        try {
            await writeFile(tempPath, buffer)
            await rename(tempPath, destPath)
        } catch (writeError) {
            await unlink(tempPath).catch(() => {})
            throw writeError
        }

        return buffer
    } catch (error) {
        console.error('Error fetching fallback upload:', error)
        return null
    }
}
