import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import {
    saveImage,
    validateImageFile,
    validateDocxFile,
} from '@/utils/file-upload'
import {
    convertArticleDocx,
    convertCitationsDocx,
    convertPreviewDocx,
    generateFileName,
} from '@/utils/docx-utils'

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
 * Update an entire article (replace all fields)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const formData = await request.formData()

        const title = formData.get('title') as string
        const shortTitle = formData.get('shortTitle') as string | null
        const author = formData.get('author') as string
        const number = parseInt(formData.get('number') as string)
        const published = formData.get('published') === 'true'
        const contentFile = formData.get('content') as File | null
        const citationsFile = formData.get('citations') as File | null
        const previewFile = formData.get('preview') as File | null
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
            include: { issue: true },
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

        // Process .docx files if provided, otherwise keep existing content
        let content = existingArticle.content
        if (contentFile && contentFile.size > 0) {
            const contentValidation = validateDocxFile(contentFile)
            if (!contentValidation.valid) {
                return NextResponse.json(
                    { error: `Content file: ${contentValidation.error}` },
                    { status: 400 },
                )
            }
            const contentBuffer = Buffer.from(await contentFile.arrayBuffer())
            content = await convertArticleDocx(contentBuffer)
        }

        let citations = existingArticle.citations
        if (citationsFile && citationsFile.size > 0) {
            const citationsValidation = validateDocxFile(citationsFile)
            if (!citationsValidation.valid) {
                return NextResponse.json(
                    { error: `Citations file: ${citationsValidation.error}` },
                    { status: 400 },
                )
            }
            const citationsBuffer = Buffer.from(
                await citationsFile.arrayBuffer(),
            )
            citations = await convertCitationsDocx(citationsBuffer)
        }

        let previewText = existingArticle.previewText
        if (previewFile && previewFile.size > 0) {
            const previewValidation = validateDocxFile(previewFile)
            if (!previewValidation.valid) {
                return NextResponse.json(
                    { error: `Preview file: ${previewValidation.error}` },
                    { status: 400 },
                )
            }
            const previewBuffer = Buffer.from(await previewFile.arrayBuffer())
            previewText = await convertPreviewDocx(previewBuffer)
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

        // Update article
        const article = await prisma.article.update({
            where: { id },
            data: {
                title,
                shortTitle: shortTitle || null,
                author,
                number,
                content,
                citations,
                previewText,
                imageUrl,
                fileName,
                published,
            },
            include: {
                issue: true,
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

        // Delete article
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
