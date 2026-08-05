import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { GET } from '@/app/api/static/[type]/[filename]/route'
import { NextRequest } from 'next/server'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { imagesDir, variantsDir, VARIANT_WIDTHS } from '@/utils/image-variants'

const FIXTURE = 'test-fixture-route-1234567890.png'

beforeAll(async () => {
    const sharp = (await import('sharp')).default
    await mkdir(imagesDir(), { recursive: true })
    const png = await sharp({
        create: {
            width: 2000,
            height: 1000,
            channels: 3,
            background: { r: 10, g: 120, b: 200 },
        },
    })
        .png()
        .toBuffer()
    await writeFile(join(imagesDir(), FIXTURE), png)
})

afterAll(async () => {
    await rm(join(imagesDir(), FIXTURE), { force: true })
    for (const width of VARIANT_WIDTHS) {
        await rm(join(variantsDir(), `${FIXTURE}@${width}.webp`), { force: true })
    }
    await rm(join(variantsDir(), `${FIXTURE}@blur.txt`), { force: true })
})

function requestFor(query: string) {
    return new NextRequest(
        `http://localhost:3000/api/static/images/${FIXTURE}${query}`,
    )
}

const params = { type: 'images', filename: FIXTURE }

describe('Static image route variant serving', () => {
    it('serves a WebP derivative for an allowlisted width', async () => {
        const response = await GET(requestFor('?w=400'), { params })

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('image/webp')

        const body = Buffer.from(await response.arrayBuffer())
        expect(body.subarray(0, 4).toString('ascii')).toBe('RIFF')
    })

    it('the derivative is substantially smaller than the original', async () => {
        const original = Buffer.from(
            await (await GET(requestFor(''), { params })).arrayBuffer(),
        )
        const variant = Buffer.from(
            await (await GET(requestFor('?w=400'), { params })).arrayBuffer(),
        )

        expect(variant.length).toBeLessThan(original.length)
    })

    it('serves the untouched original when no width is given', async () => {
        const response = await GET(requestFor(''), { params })

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('image/png')
    })

    it('ignores a width that is not on the allowlist and serves the original', async () => {
        for (const query of ['?w=401', '?w=9999', '?w=abc', '?w=-400']) {
            const response = await GET(requestFor(query), { params })

            expect(response.status).toBe(200)
            expect(response.headers.get('Content-Type')).toBe('image/png')
        }
    })

    it('keeps the immutable cache header on derivatives', async () => {
        const response = await GET(requestFor('?w=800'), { params })

        expect(response.headers.get('Cache-Control')).toContain('immutable')
    })

    it('still rejects path traversal when a width is supplied', async () => {
        const response = await GET(
            new NextRequest(
                'http://localhost:3000/api/static/images/..%2F..%2F.env?w=400',
            ),
            { params: { type: 'images', filename: '../../.env' } },
        )

        expect([400, 404]).toContain(response.status)
    })

    it('ignores ?w= for non-image types', async () => {
        const response = await GET(
            new NextRequest(
                'http://localhost:3000/api/static/articles/nope-123.docx?w=400',
            ),
            { params: { type: 'articles', filename: 'nope-123.docx' } },
        )

        // File does not exist, so this is a 404 - the point is that it did not
        // try to treat a .docx as an image.
        expect(response.status).toBe(404)
    })
})
