import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { basename, resolve, sep } from 'path'
import { existsSync } from 'fs'
import { getVariant, parseVariantWidth } from '@/utils/image-variants'
import {
    fetchAndCacheUpload,
    FALLBACK_GUARD_HEADER,
} from '@/utils/uploads-fallback'

/** Determine content type based on file extension. */
function contentTypeForExt(ext: string | undefined): string {
    if (ext === 'png') return 'image/png'
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
    if (ext === 'gif') return 'image/gif'
    if (ext === 'webp') return 'image/webp'
    if (ext === 'docx') {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    if (ext === 'pdf') return 'application/pdf'
    return 'application/octet-stream'
}

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

        // Check if file exists. If it's missing, try borrowing it from the
        // other host (dual-hosted OCF/Railway setups share one database but
        // have separate local uploads/ disks) - but never when this request
        // itself arrived via that fallback path, so two hosts that both lack
        // the file cannot ping-pong forever.
        if (!existsSync(filePath)) {
            if (!request.headers.has(FALLBACK_GUARD_HEADER)) {
                const fallbackBuffer = await fetchAndCacheUpload(
                    `/${type}/${safeFilename}`,
                )
                if (fallbackBuffer) {
                    const ext = safeFilename.split('.').pop()?.toLowerCase()
                    const contentType = contentTypeForExt(ext)
                    return new NextResponse(new Uint8Array(fallbackBuffer), {
                        headers: {
                            'Content-Type': contentType,
                            'Cache-Control':
                                'public, max-age=31536000, immutable',
                            'Content-Disposition':
                                type === 'articles' || type === 'pdfs'
                                    ? `attachment; filename="${safeFilename}"`
                                    : 'inline',
                        },
                    })
                }
            }

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
        const contentType = contentTypeForExt(ext)

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
