import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import {
    fetchAndCacheUpload,
    FALLBACK_GUARD_HEADER,
} from '@/utils/uploads-fallback'
import * as fs from 'fs/promises'
import { restoreMocks } from '../mock-utils'

const FALLBACK_URL = 'https://other-host.example.com'

function mockResponse(status: number, body: string) {
    return new Response(body, { status })
}

describe('fetchAndCacheUpload', () => {
    let originalEnv: string | undefined
    let mkdirSpy: ReturnType<typeof spyOn>
    let writeFileSpy: ReturnType<typeof spyOn>
    let renameSpy: ReturnType<typeof spyOn>

    beforeEach(() => {
        originalEnv = process.env.UPLOADS_FALLBACK_URL
        mkdirSpy = spyOn(fs, 'mkdir').mockResolvedValue(undefined)
        writeFileSpy = spyOn(fs, 'writeFile').mockResolvedValue(undefined)
        renameSpy = spyOn(fs, 'rename').mockResolvedValue(undefined)
    })

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.UPLOADS_FALLBACK_URL
        } else {
            process.env.UPLOADS_FALLBACK_URL = originalEnv
        }
        restoreMocks(mkdirSpy, writeFileSpy, renameSpy)
        // @ts-expect-error - fetch may or may not have been spied on per-test
        if (globalThis.fetch?.mockRestore) globalThis.fetch.mockRestore()
    })

    it('returns null when UPLOADS_FALLBACK_URL is unset', async () => {
        delete process.env.UPLOADS_FALLBACK_URL
        const fetchSpy = spyOn(globalThis, 'fetch')

        const result = await fetchAndCacheUpload('/images/file.jpg')

        expect(result).toBeNull()
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('rejects a path containing .. without fetching', async () => {
        process.env.UPLOADS_FALLBACK_URL = FALLBACK_URL
        const fetchSpy = spyOn(globalThis, 'fetch')

        const result = await fetchAndCacheUpload('/images/../../etc/passwd')

        expect(result).toBeNull()
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('rejects a path outside the three allowed prefixes without fetching', async () => {
        process.env.UPLOADS_FALLBACK_URL = FALLBACK_URL
        const fetchSpy = spyOn(globalThis, 'fetch')

        const result = await fetchAndCacheUpload('/secrets/file.env')

        expect(result).toBeNull()
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('fetches with the guard header, writes the file, and returns the buffer on 200', async () => {
        process.env.UPLOADS_FALLBACK_URL = FALLBACK_URL
        const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
            mockResponse(200, 'file-bytes'),
        )

        const result = await fetchAndCacheUpload('/images/file.jpg')

        expect(result).not.toBeNull()
        expect(result!.toString()).toBe('file-bytes')

        expect(fetchSpy).toHaveBeenCalledTimes(1)
        const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(url).toBe(`${FALLBACK_URL}/images/file.jpg`)
        expect((init.headers as Record<string, string>)[FALLBACK_GUARD_HEADER]).toBe(
            '1',
        )

        expect(mkdirSpy).toHaveBeenCalled()
        expect(writeFileSpy).toHaveBeenCalled()
        expect(renameSpy).toHaveBeenCalled()
    })

    it('returns null on a non-200 response without writing', async () => {
        process.env.UPLOADS_FALLBACK_URL = FALLBACK_URL
        spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(404, ''))

        const result = await fetchAndCacheUpload('/articles/missing.docx')

        expect(result).toBeNull()
        expect(writeFileSpy).not.toHaveBeenCalled()
    })

    it('returns null when fetch throws, without writing', async () => {
        process.env.UPLOADS_FALLBACK_URL = FALLBACK_URL
        spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

        const result = await fetchAndCacheUpload('/pdfs/issue.pdf')

        expect(result).toBeNull()
        expect(writeFileSpy).not.toHaveBeenCalled()
    })
})
