import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * GET /api/static/images/[filename] or /api/static/articles/[filename]
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

        // Validate type (images or articles)
        if (type !== 'images' && type !== 'articles') {
            return NextResponse.json(
                { error: 'Invalid file type' },
                { status: 400 }
            )
        }

        // Build file path to uploaded files
        const filePath = join(process.cwd(), 'uploads', type, filename)

        // Check if file exists
        if (!existsSync(filePath)) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            )
        }

        // Read file
        const fileBuffer = await readFile(filePath)

        // Determine content type based on extension
        const ext = filename.split('.').pop()?.toLowerCase()
        let contentType = 'application/octet-stream'

        if (ext === 'png') contentType = 'image/png'
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
        else if (ext === 'gif') contentType = 'image/gif'
        else if (ext === 'webp') contentType = 'image/webp'
        else if (ext === 'docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }

        // Return file with aggressive caching headers
        // Files are immutable (timestamped filenames), so cache forever
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Disposition': type === 'articles'
                    ? `attachment; filename="${filename}"`
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
