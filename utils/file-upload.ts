import { existsSync } from 'fs'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

/** Maximum allowed size for uploaded files (200MB) */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

/**
 * Longest edge, in pixels, that a stored image is allowed to have. Cover art and
 * article images are displayed at well under this, so anything larger is wasted
 * bytes on every page load. Images smaller than this are never upscaled.
 */
export const MAX_IMAGE_DIMENSION = 2400

/** WebP quality for re-encoded uploads. 82 is visually lossless for photos. */
export const IMAGE_QUALITY = 82

/**
 * Re-encode an uploaded image to a web-appropriate size and format.
 *
 * Originals straight off a phone or scanner are routinely 10-50MB, which is
 * enormous for a page that renders them a few hundred pixels wide. This shrinks
 * the longest edge to MAX_IMAGE_DIMENSION and re-encodes as WebP.
 *
 * Animated GIFs are passed through untouched — re-encoding would flatten them to
 * a single frame. If sharp cannot decode the input at all, the original bytes are
 * stored rather than failing the upload.
 *
 * @returns the bytes to write and the file extension they should be stored under
 */
export async function compressImage(
    buffer: Buffer,
    mimeType: string,
): Promise<{ buffer: Buffer; extension: string }> {
    if (mimeType === 'image/gif') {
        return { buffer, extension: 'gif' }
    }

    try {
        const compressed = await sharp(buffer)
            // Honour EXIF orientation, then strip metadata, so portrait photos
            // don't come out sideways once the orientation tag is gone.
            .rotate()
            .resize({
                width: MAX_IMAGE_DIMENSION,
                height: MAX_IMAGE_DIMENSION,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: IMAGE_QUALITY })
            .toBuffer()

        // Guard against the rare case where re-encoding grows the file (already
        // well-optimised small images); keep whichever is smaller.
        if (compressed.length < buffer.length) {
            return { buffer: compressed, extension: 'webp' }
        }
        return { buffer, extension: extensionForMime(mimeType) }
    } catch (error) {
        console.error('Image compression failed, storing original:', error)
        return { buffer, extension: extensionForMime(mimeType) }
    }
}

/** Map a validated image MIME type to a safe file extension. */
function extensionForMime(mimeType: string): string {
    switch (mimeType) {
        case 'image/png':
            return 'png'
        case 'image/webp':
            return 'webp'
        case 'image/gif':
            return 'gif'
        default:
            return 'jpg'
    }
}

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
    const original = Buffer.from(bytes)

    // Create directory structure: /uploads/images/
    const imagesDir = join(process.cwd(), 'uploads', 'images')
    if (!existsSync(imagesDir)) {
        await mkdir(imagesDir, { recursive: true })
    }

    // Shrink and re-encode before storing. The extension comes from the encoder,
    // not from the uploaded filename, so a file named "photo" with no extension
    // can no longer produce a bogus one.
    const { buffer, extension } = await compressImage(original, file.type)

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

    // Create directory structure: /uploads/articles/
    const articlesDir = join(process.cwd(), 'uploads', 'articles')
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
    const maxSize = MAX_UPLOAD_BYTES

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
    const maxSize = MAX_UPLOAD_BYTES

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
 * Validate that uploaded file is a PDF document
 */
export function validatePdfFile(file: File): {
    valid: boolean
    error?: string
} {
    const allowedTypes = ['application/pdf']
    const maxSize = MAX_UPLOAD_BYTES

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. File must be a PDF document',
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
 * Save uploaded PDF file to public directory
 * @param file - The uploaded PDF file
 * @param prefix - Prefix for filename (e.g., 'issue')
 * @returns The public URL path to the saved PDF file
 */
export async function savePdf(
    file: File,
    prefix: string = 'issue',
): Promise<string> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create directory structure: /uploads/pdfs/
    const pdfsDir = join(process.cwd(), 'uploads', 'pdfs')
    if (!existsSync(pdfsDir)) {
        await mkdir(pdfsDir, { recursive: true })
    }

    // Generate filename with timestamp
    const timestamp = Date.now()
    const filename = `${prefix}-${timestamp}.pdf`

    // Save file
    const filepath = join(pdfsDir, filename)
    await writeFile(filepath, buffer)

    // Return public URL path
    return `/pdfs/${filename}`
}

/**
 * Delete a file from the filesystem
 * @param publicPath - The public path (e.g., '/images/file.jpg', '/articles/file.docx')
 */
export async function deleteFile(publicPath: string | null): Promise<void> {
    if (!publicPath) return

    try {
        // publicPath is like '/images/file.jpg' or '/articles/file.docx'
        // Remove leading slash and prepend 'uploads/'
        const relativePath = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath
        const filepath = join(process.cwd(), 'uploads', relativePath)
        if (existsSync(filepath)) {
            await unlink(filepath)
        }
    } catch (error) {
        console.error(`Failed to delete file ${publicPath}:`, error)
    }
}
