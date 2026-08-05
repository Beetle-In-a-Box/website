import { existsSync } from 'fs'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import {
    deleteVariants,
    loadSharp,
    MAX_ORIGINAL_DIMENSION,
    warmVariants,
} from '@/utils/image-variants'

/** Maximum allowed size for uploaded files (200MB) */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

/**
 * Prepare an uploaded image for storage as the canonical full-resolution copy.
 *
 * The stored file is what the "open full resolution" link serves, so it is kept
 * as close to what was uploaded as possible: bytes are passed through untouched
 * unless the longest edge exceeds MAX_ORIGINAL_DIMENSION, in which case the
 * image is downscaled once. Compressed, display-sized copies are derivatives
 * produced separately by utils/image-variants - this function is not where
 * compression happens.
 *
 * Animated GIFs pass through untouched; re-encoding would flatten them to one
 * frame. If sharp cannot decode the input at all, the original bytes are stored
 * rather than failing the upload.
 *
 * @returns the bytes to write and the extension they should be stored under
 */
export async function storeOriginal(
    buffer: Buffer,
    mimeType: string,
): Promise<{ buffer: Buffer; extension: string }> {
    if (mimeType === 'image/gif') {
        return { buffer, extension: 'gif' }
    }

    const sharp = await loadSharp()
    if (!sharp) {
        return { buffer, extension: extensionForMime(mimeType) }
    }

    try {
        const image = sharp(buffer)
        const metadata = await image.metadata()
        const longestEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0)

        // Trust what sharp actually decoded, not the caller-supplied MIME type.
        // File.type comes from the browser, which infers it from the uploaded
        // file's name - a real PNG saved with a .jpg extension reports
        // 'image/jpeg' while its bytes are PNG. Storing under the MIME-derived
        // extension would then serve mismatched Content-Type vs. bytes on the
        // "open full resolution" link.
        const extension = extensionForFormat(metadata.format, mimeType)

        // Already within the cap: store the exact bytes that were uploaded. Any
        // re-encode here would lose quality for no benefit.
        if (longestEdge <= MAX_ORIGINAL_DIMENSION) {
            return { buffer, extension }
        }

        const resized = await image
            .rotate()
            .resize({
                width: MAX_ORIGINAL_DIMENSION,
                height: MAX_ORIGINAL_DIMENSION,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toBuffer()

        return { buffer: resized, extension }
    } catch (error) {
        console.error('Could not inspect upload, storing original:', error)
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
 * Map sharp's detected source format to a stored extension.
 *
 * Used only when sharp has successfully decoded the image, so this is the
 * source of truth for what the bytes actually are - unlike extensionForMime,
 * which only knows what the browser claimed. Falls back to the MIME-derived
 * guess for any format outside the upload allowlist, rather than inventing an
 * extension for something like TIFF or HEIF.
 */
function extensionForFormat(format: string | undefined, mimeType: string): string {
    switch (format) {
        case 'jpeg':
            return 'jpg'
        case 'png':
            return 'png'
        case 'webp':
            return 'webp'
        case 'gif':
            return 'gif'
        default:
            return extensionForMime(mimeType)
    }
}

/**
 * Save an uploaded image as the canonical full-resolution original, then generate its display derivatives.
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

    // Store the full-resolution original. The extension comes from the encoder,
    // not from the uploaded filename, so a file named "photo" with no extension
    // can no longer produce a bogus one.
    const { buffer, extension } = await storeOriginal(original, file.type)

    const timestamp = Date.now()
    const filename = `${prefix}-${timestamp}.${extension}`

    // Save file
    const filepath = join(imagesDir, filename)
    await writeFile(filepath, buffer)

    // Generate the display-sized derivatives now so the first visitor is not the
    // one paying to encode them. Never fatal - warmVariants swallows failures.
    await warmVariants(filename)

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
            // Drop the derivative cache too, or it accumulates orphans.
            if (relativePath.startsWith('images/')) {
                await deleteVariants(relativePath.slice('images/'.length))
            }
        }
    } catch (error) {
        console.error(`Failed to delete file ${publicPath}:`, error)
    }
}
