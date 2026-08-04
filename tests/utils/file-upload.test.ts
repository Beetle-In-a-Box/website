import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { validateImageFile, saveImage, MAX_UPLOAD_BYTES } from '@/utils/file-upload'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import { restoreMocks } from '../mock-utils'

describe('File Upload Utilities', () => {
    afterEach(() => {
        // Restore all mocks after each test to prevent leaks
        restoreMocks(fs.mkdir, fs.writeFile, fsSync.existsSync)
    })
    describe('validateImageFile', () => {
        it('should validate a valid JPEG image file', () => {
            const file = new File(['fake image content'], 'test.jpg', {
                type: 'image/jpeg',
            })
            Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

            const result = validateImageFile(file)

            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it('should reject files that are too large (>200MB)', () => {
            const file = new File(['fake image content'], 'large.jpg', {
                type: 'image/jpeg',
            })
            Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES + 1 })

            const result = validateImageFile(file)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('too large')
            expect(result.error).toContain('200MB')
        })

        it('should accept a file right at the 200MB limit', () => {
            const file = new File(['fake image content'], 'at-limit.jpg', {
                type: 'image/jpeg',
            })
            Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES })

            const result = validateImageFile(file)

            expect(result.valid).toBe(true)
        })

        it('should accept a normal-sized file', () => {
            const file = new File(['fake image content'], 'normal.jpg', {
                type: 'image/jpeg',
            })
            Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }) // 2MB

            const result = validateImageFile(file)

            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it('should reject non-image files', () => {
            const file = new File(['fake content'], 'document.pdf', {
                type: 'application/pdf',
            })
            Object.defineProperty(file, 'size', { value: 1024 }) // 1KB

            const result = validateImageFile(file)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('Invalid file type')
        })

        it('should accept PNG images', () => {
            const file = new File(['fake png content'], 'test.png', {
                type: 'image/png',
            })
            Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

            const result = validateImageFile(file)

            expect(result.valid).toBe(true)
        })

        it('should accept WebP images', () => {
            const file = new File(['fake webp content'], 'test.webp', {
                type: 'image/webp',
            })
            Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

            const result = validateImageFile(file)

            expect(result.valid).toBe(true)
        })

        it('should accept GIF images', () => {
            const file = new File(['fake gif content'], 'test.gif', {
                type: 'image/gif',
            })
            Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

            const result = validateImageFile(file)

            expect(result.valid).toBe(true)
        })

        it('should accept files with zero size (empty images are technically valid)', () => {
            const file = new File([], 'empty.jpg', { type: 'image/jpeg' })
            Object.defineProperty(file, 'size', { value: 0 })

            const result = validateImageFile(file)

            // The implementation doesn't check for zero size, only max size
            expect(result.valid).toBe(true)
        })
    })

    describe('saveImage', () => {
        beforeEach(() => {
            // Mock fs operations
            spyOn(fs, 'mkdir').mockResolvedValue(undefined)
            spyOn(fs, 'writeFile').mockResolvedValue(undefined)
            spyOn(fsSync, 'existsSync').mockReturnValue(false)
        })

        it('should save an image and return the correct path', async () => {
            const file = new File(['fake image content'], 'test.jpg', {
                type: 'image/jpeg',
            })
            const issueNumber = 1

            const result = await saveImage(file, issueNumber, 'article')

            expect(result).toMatch(/^\/images\/article-\d+\.jpg$/)
            expect(fs.mkdir).toHaveBeenCalled()
            expect(fs.writeFile).toHaveBeenCalled()
        })

        it('should create the directory if it does not exist', async () => {
            const file = new File(['fake image content'], 'test.png', {
                type: 'image/png',
            })
            const issueNumber = 2

            await saveImage(file, issueNumber, 'issue-cover')

            expect(fs.mkdir).toHaveBeenCalled()
            const mkdirCall = (fs.mkdir as unknown as { mock?: { calls?: unknown[][] } })
                .mock?.calls?.[0]
            if (mkdirCall) {
                expect(mkdirCall[0]).toContain('images')
                expect(mkdirCall[1]).toEqual({ recursive: true })
            }
        })

        it('should preserve file extension', async () => {
            const pngFile = new File(['fake png content'], 'test.png', {
                type: 'image/png',
            })
            const result = await saveImage(pngFile, 1, 'test')

            expect(result).toMatch(/\.png$/)
        })

        it('should derive the extension from the encoder, not the uploaded filename', async () => {
            const file = new File(['fake content'], 'test', {
                type: 'image/jpeg',
            })
            const result = await saveImage(file, 1, 'test')

            // The bytes here are not a decodable image, so compression falls back
            // to the original buffer and the extension comes from the MIME type.
            // Critically it is NOT 'test' — the filename no longer decides it.
            expect(result).toMatch(/\/images\/test-\d+\.jpg$/)
        })

        it('should use unique timestamps for different files', async () => {
            const file1 = new File(['content1'], 'test1.jpg', {
                type: 'image/jpeg',
            })
            const file2 = new File(['content2'], 'test2.jpg', {
                type: 'image/jpeg',
            })

            const result1 = await saveImage(file1, 1, 'article')
            // Small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10))
            const result2 = await saveImage(file2, 1, 'article')

            expect(result1).not.toBe(result2)
        })

        it('should throw an error if file write fails', async () => {
            spyOn(fs, 'writeFile').mockRejectedValue(
                new Error('Write failed'),
            )

            const file = new File(['fake content'], 'test.jpg', {
                type: 'image/jpeg',
            })

            await expect(saveImage(file, 1, 'test')).rejects.toThrow(
                'Write failed',
            )
        })
    })
})
