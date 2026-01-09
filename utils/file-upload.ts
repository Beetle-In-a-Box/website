import { existsSync } from 'fs'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'

/**
 * Save uploaded image file to public directory
 * @param file - The uploaded file
 * @param issueNumber - Issue number (unused now, kept for API compatibility)
 * @param prefix - Prefix for filename (e.g., 'issue', 'article')
 * @returns The public URL path to the saved image
 */
export async function saveImage(
    file: File,
    issueNumber: number,
    prefix: string = 'image',
): Promise<string> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create directory structure: /public/images/
    const imagesDir = join(process.cwd(), 'public', 'images')
    if (!existsSync(imagesDir)) {
        await mkdir(imagesDir, { recursive: true })
    }

    // Generate filename
    const extension = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const filename = `${prefix}-${timestamp}.${extension}`

    // Save file
    const filepath = join(imagesDir, filename)
    await writeFile(filepath, buffer)

    // Return public URL path
    return `/images/${filename}`
}

/**
 * Save uploaded .docx file to public directory
 * @param file - The uploaded .docx file
 * @param prefix - Prefix for filename (e.g., 'article')
 * @returns The public URL path to the saved .docx file
 */
export async function saveDocx(
    file: File,
    prefix: string = 'article',
): Promise<string> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create directory structure: /public/articles/
    const articlesDir = join(process.cwd(), 'public', 'articles')
    if (!existsSync(articlesDir)) {
        await mkdir(articlesDir, { recursive: true })
    }

    // Generate filename with timestamp
    const timestamp = Date.now()
    const filename = `${prefix}-${timestamp}.docx`

    // Save file
    const filepath = join(articlesDir, filename)
    await writeFile(filepath, buffer)

    // Return public URL path
    return `/articles/${filename}`
}

/**
 * Validate that uploaded file is an image
 */
export function validateImageFile(file: File): {
    valid: boolean
    error?: string
} {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
    ]
    const maxSize = 50 * 1024 * 1024 // 50MB

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        }
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
        }
    }

    return { valid: true }
}

/**
 * Validate that uploaded file is a .docx document
 */
export function validateDocxFile(file: File): {
    valid: boolean
    error?: string
} {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
    ]
    const maxSize = 50 * 1024 * 1024 // 50MB

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. File must be a .docx document',
        }
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
        }
    }

    if (file.size === 0) {
        return {
            valid: false,
            error: 'File is empty',
        }
    }

    return { valid: true }
}

/**
 * Delete a file from the filesystem
 * @param publicPath - The public path (e.g., '/images/file.jpg', '/articles/file.docx')
 */
export async function deleteFile(publicPath: string | null): Promise<void> {
    if (!publicPath) return

    try {
        const filepath = join(process.cwd(), 'public', publicPath)
        if (existsSync(filepath)) {
            await unlink(filepath)
        }
    } catch (error) {
        console.error(`Failed to delete file ${publicPath}:`, error)
    }
}
