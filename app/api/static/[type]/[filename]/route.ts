import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { basename, resolve, sep } from 'path'
import { existsSync } from 'fs'
import { getVariant, parseVariantWidth } from '@/utils/image-variants'

/**
 * GET /api/static/images/[filename] or /api/static/articles/[filename] or /api/static/pdfs/[filename]
 * Serve uploaded files from the volume at runtime
 *
 * This API is transparent to the browser - files are loaded normally in HTML,
 * and Next.js rewrites route them here at runtime.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; filename: string }> }
) {
    try {
        const { type, filename } = await params

        // Validate type (images, articles, or pdfs)
        if (type !== 'images' && type !== 'articles' && type !== 'pdfs') {
            return NextResponse.json(
                { error: 'Invalid file type' },
                { status: 400 }
            )
        }

        // Sanitize filename: strip any directory components. If the sanitized
        // name differs from the input (or is empty/'.'/'..'), the input was
        // attempting path traversal - reject it outright.
        const safeFilename = basename(filename)
        if (
            !safeFilename ||
            safeFilename !== filename ||
            safeFilename === '.' ||
            safeFilename === '..'
        ) {
            return NextResponse.json(
                { error: 'Invalid filename' },
                { status: 400 }
            )
        }

        // Build file path to uploaded files
        const uploadsDir = resolve(process.cwd(), 'uploads', type)
        const filePath = resolve(uploadsDir, safeFilename)

        // Containment check: ensure the resolved path is genuinely inside the
        // resolved uploads/<type> directory (include trailing separator so a
        // sibling directory like 'uploads-evil' cannot pass this check).
        if (!filePath.startsWith(uploadsDir + sep)) {
            return NextResponse.json(
                { error: 'Invalid filename' },
                { status: 400 }
            )
        }

        // Check if file exists
        if (!existsSync(filePath)) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            )
        }

        // Serve a compressed derivative when an allowlisted width is requested.
        // This runs only after every sanitisation and containment check above
        // has passed. An unrecognised width falls through to the original,
        // which is also what the full-resolution click-through link requests.
        if (type === 'images') {
            const width = parseVariantWidth(
                request.nextUrl.searchParams.get('w'),
            )
            if (width) {
                const variant = await getVariant(safeFilename, width)
                if (variant) {
                    return new NextResponse(new Uint8Array(variant), {
                        headers: {
                            'Content-Type': 'image/webp',
                            'Cache-Control':
                                'public, max-age=31536000, immutable',
                            'Content-Disposition': 'inline',
                        },
                    })
                }
                // sharp unavailable or encoding failed - fall through and serve
                // the original rather than 500ing.
            }
        }

        // Read file
        const fileBuffer = await readFile(filePath)

        // Determine content type based on extension
        const ext = safeFilename.split('.').pop()?.toLowerCase()
        let contentType = 'application/octet-stream'

        if (ext === 'png') contentType = 'image/png'
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
        else if (ext === 'gif') contentType = 'image/gif'
        else if (ext === 'webp') contentType = 'image/webp'
        else if (ext === 'docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        else if (ext === 'pdf') {
            contentType = 'application/pdf'
        }

        // Return file with aggressive caching headers
        // Files are immutable (timestamped filenames), so cache forever
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Disposition': (type === 'articles' || type === 'pdfs')
                    ? `attachment; filename="${safeFilename}"`
                    : 'inline',
            },
        })
    } catch (error) {
        console.error('Error serving file:', error)
        return NextResponse.json(
            { error: 'Failed to serve file' },
            { status: 500 }
        )
    }
}
