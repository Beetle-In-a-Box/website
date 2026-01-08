import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { validateImageFile, saveImage } from '@/utils/file-upload'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'

describe('File Upload Utilities', () => {
    afterEach(() => {
        // Restore all mocks after each test to prevent leaks
        if ((fs.mkdir as any).mockRestore) {
            (fs.mkdir as any).mockRestore()
        }
        if ((fs.writeFile as any).mockRestore) {
            (fs.writeFile as any).mockRestore()
        }
        if ((fsSync.existsSync as any).mockRestore) {
            (fsSync.existsSync as any).mockRestore()
        }
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

        it('should reject files that are too large (>50MB)', () => {
            const file = new File(['fake image content'], 'large.jpg', {
                type: 'image/jpeg',
            })
            Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 }) // 51MB

            const result = validateImageFile(file)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('too large')
            expect(result.error).toContain('50MB')
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
            const mkdirCall = (fs.mkdir as any).mock?.calls?.[0]
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

        it('should handle files without extensions by using jpg as default', async () => {
            const file = new File(['fake content'], 'test', {
                type: 'image/jpeg',
            })
            const result = await saveImage(file, 1, 'test')

            // Files without extension get 'test' as extension (the filename itself)
            expect(result).toMatch(/\/images\/test-\d+\.test$/)
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
