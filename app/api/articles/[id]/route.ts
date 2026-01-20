import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { verifyAuth } from '@/utils/auth'
import {
    saveImage,
    saveDocx,
    validateImageFile,
    validateDocxFile,
    deleteFile,
} from '@/utils/file-upload'
import { generateFileName, convertPreviewDocx } from '@/utils/docx-utils'

/**
 * GET /api/articles/[id]
 * Get a specific article by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                issue: true,
            },
        })

        if (!article) {
            return NextResponse.json(
                { error: 'Article not found' },
                { status: 404 },
            )
        }

        return NextResponse.json(article)
    } catch (error) {
        console.error('Error fetching article:', error)
        return NextResponse.json(
            { error: 'Failed to fetch article' },
            { status: 500 },
        )
    }
}

/**
 * PUT /api/articles/[id]
 * Update an article
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const token = request.cookies.get('admin-token')?.value
        const isAuthenticated = await verifyAuth(token)
        if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const formData = await request.formData()

        const title = formData.get('title') as string
        const shortTitle = formData.get('shortTitle') as string | null
        const author = formData.get('author') as string
        const imageArtist = formData.get('imageArtist') as string | null
        const number = parseInt(formData.get('number') as string)
        const published = formData.get('published') === 'true'
        const contentFile = formData.get('content') as File | null
        const imageFile = formData.get('image') as File | null

        // Validation
        if (!title || !author || !number) {
            return NextResponse.json(
                { error: 'Missing required fields: title, author, number' },
                { status: 400 },
            )
        }

        // Check if article exists
        const existingArticle = await prisma.article.findUnique({
            where: { id },
            include: { issue: true, author: true },
        })

        if (!existingArticle) {
            return NextResponse.json(
                { error: 'Article not found' },
                { status: 404 },
            )
        }

        // Check if new number conflicts with another article in the same issue
        if (number !== existingArticle.number) {
            const conflictingArticle = await prisma.article.findUnique({
                where: {
                    issueId_number: {
                        issueId: existingArticle.issueId,
                        number,
                    },
                },
            })

            if (conflictingArticle && conflictingArticle.id !== id) {
                return NextResponse.json(
                    { error: `Article ${number} already exists in this issue` },
                    { status: 409 },
                )
            }
        }

        // Process .docx file if provided, otherwise keep existing path
        let contentDocxPath = existingArticle.contentDocxPath
        let previewText = existingArticle.previewText
        if (contentFile && contentFile.size > 0) {
            const contentValidation = validateDocxFile(contentFile)
            if (!contentValidation.valid) {
                return NextResponse.json(
                    { error: `Content file: ${contentValidation.error}` },
                    { status: 400 },
                )
            }
            contentDocxPath = await saveDocx(contentFile, `article-${number}`)

            // Regenerate preview text from new .docx
            const contentBuffer = Buffer.from(await contentFile.arrayBuffer())
            previewText = await convertPreviewDocx(contentBuffer)
        }

        // Handle image upload
        let imageUrl = existingArticle.imageUrl
        if (imageFile && imageFile.size > 0) {
            const validation = validateImageFile(imageFile)
            if (!validation.valid) {
                return NextResponse.json(
                    { error: validation.error },
                    { status: 400 },
                )
            }
            imageUrl = await saveImage(
                imageFile,
                existingArticle.issue.number,
                `article-${number}`,
            )
        }

        // Generate filename if title changed
        const fileName =
            title !== existingArticle.title
                ? generateFileName(title)
                : existingArticle.fileName

        // If author name changed, look up the author
        let authorId: string | null = existingArticle.authorId
        if (author && author !== (typeof existingArticle.author === 'object' ? existingArticle.author?.name : existingArticle.author)) {
            // Look up author by name
            const authorRecord = await prisma.author.findFirst({
                where: { name: author },
            })
            if (authorRecord) {
                authorId = authorRecord.id
            } else {
                // Create new author if it doesn't exist
                const newAuthor = await prisma.author.create({
                    data: {
                        name: author,
                        slug: `${author.toLowerCase().replace(/\s+/g, '-')}-${id.substring(0, 6)}`,
                    },
                })
                authorId = newAuthor.id
            }
        }

        // Update article
        const article = await prisma.article.update({
            where: { id },
            data: {
                title,
                shortTitle: shortTitle || null,
                authorId,
                imageArtist: imageArtist || null,
                number,
                contentDocxPath,
                previewText,
                imageUrl,
                fileName,
                published,
            },
            include: {
                issue: true,
                author: true,
            },
        })

        return NextResponse.json(article)
    } catch (error) {
        console.error('Error updating article:', error)
        return NextResponse.json(
            { error: 'Failed to update article' },
            { status: 500 },
        )
    }
}

/**
 * DELETE /api/articles/[id]
 * Delete an article
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const token = request.cookies.get('admin-token')?.value
        const isAuthenticated = await verifyAuth(token)
        if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const article = await prisma.article.findUnique({
            where: { id },
        })

        if (!article) {
            return NextResponse.json(
                { error: 'Article not found' },
                { status: 404 },
            )
        }

        // Delete associated files
        await deleteFile(article.imageUrl)
        await deleteFile(article.contentDocxPath)

        // Delete article from database
        await prisma.article.delete({
            where: { id },
        })

        return NextResponse.json(
            { message: `Article "${article.title}" deleted successfully` },
            { status: 200 },
        )
    } catch (error) {
        console.error('Error deleting article:', error)
        return NextResponse.json(
            { error: 'Failed to delete article' },
            { status: 500 },
        )
    }
}
