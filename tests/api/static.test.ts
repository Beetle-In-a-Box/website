import { describe, it, expect, afterEach, spyOn } from 'bun:test'
import { GET } from '@/app/api/static/[type]/[filename]/route'
import { NextRequest } from 'next/server'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import { restoreMocks } from '../mock-utils'

describe('Static file serving API', () => {
    afterEach(() => {
        // Restore all mocks after each test
        restoreMocks(fs.readFile, fsSync.existsSync)
    })

    describe('GET /api/static/[type]/[filename]', () => {
        it('should serve an ordinary filename normally', async () => {
            spyOn(fsSync, 'existsSync').mockReturnValue(true)
            spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('fake image bytes'))

            const request = new NextRequest(
                'http://localhost:3000/api/static/images/issue-cover-123.jpg',
            )

            const response = await GET(request, {
                params: { type: 'images', filename: 'issue-cover-123.jpg' },
            })

            expect(response.status).toBe(200)
            expect(fs.readFile).toHaveBeenCalled()

            const body = Buffer.from(await response.arrayBuffer())
            expect(body.toString()).toBe('fake image bytes')
        })

        it('should reject an encoded path-traversal filename and never read from disk', async () => {
            spyOn(fsSync, 'existsSync').mockReturnValue(true)
            const readFileSpy = spyOn(fs, 'readFile').mockResolvedValue(
                Buffer.from('SESSION_SECRET=super-secret'),
            )

            const request = new NextRequest(
                'http://localhost:3000/api/static/images/..%2F..%2F.env',
            )

            // Next.js decodes dynamic segments before handing them to the route,
            // so a traversal attempt arrives here already decoded like this.
            const response = await GET(request, {
                params: { type: 'images', filename: '../../.env' },
            })
            const data = await response.json()

            expect([400, 404]).toContain(response.status)
            expect(data.error).toBeTruthy()
            expect(readFileSpy).not.toHaveBeenCalled()
        })

        it('should reject a bare ".." filename', async () => {
            const readFileSpy = spyOn(fs, 'readFile').mockResolvedValue(Buffer.from(''))

            const request = new NextRequest(
                'http://localhost:3000/api/static/articles/..',
            )

            const response = await GET(request, {
                params: { type: 'articles', filename: '..' },
            })
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBeTruthy()
            expect(readFileSpy).not.toHaveBeenCalled()
        })

        it('should return 404 if the (safe) file does not exist on disk', async () => {
            spyOn(fsSync, 'existsSync').mockReturnValue(false)
            const readFileSpy = spyOn(fs, 'readFile').mockResolvedValue(Buffer.from(''))

            const request = new NextRequest(
                'http://localhost:3000/api/static/images/missing.jpg',
            )

            const response = await GET(request, {
                params: { type: 'images', filename: 'missing.jpg' },
            })
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toContain('not found')
            expect(readFileSpy).not.toHaveBeenCalled()
        })

        it('should return 400 for a file type outside images/articles/pdfs', async () => {
            const request = new NextRequest(
                'http://localhost:3000/api/static/secrets/whatever.txt',
            )

            const response = await GET(request, {
                params: { type: 'secrets', filename: 'whatever.txt' },
            })
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('Invalid file type')
        })
    })
})
