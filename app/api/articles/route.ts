import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { verifyAuth } from '@/utils/auth'
import {
    saveImage,
    saveDocx,
    validateImageFile,
    validateDocxFile,
} from '@/utils/file-upload'
import { generateFileName, convertPreviewDocx } from '@/utils/docx-utils'

export const config = {
    maxDuration: 300,
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
}

/**
 * POST /api/articles
 * Create a new article with .docx file for content (with endnotes)
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('admin-token')?.value
        const isAuthenticated = await verifyAuth(token)
        if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()

        const issueId = formData.get('issueId') as string
        const title = formData.get('title') as string
        const shortTitle = formData.get('shortTitle') as string | null
        const author = formData.get('author') as string
        const imageArtist = formData.get('imageArtist') as string | null
        const number = parseInt(formData.get('number') as string)
        const published = formData.get('published') === 'true'

        const contentFile = formData.get('content') as File | null
        const imageFile = formData.get('image') as File | null

        // Validation with detailed logging
        console.log('Form data received:', {
            issueId,
            title,
            author,
            number,
            contentFile: contentFile ? `File: ${contentFile.name}` : null,
            imageFile: imageFile ? `File: ${imageFile.name}` : null,
        })

        if (!issueId || !title || !author || isNaN(number) || !contentFile) {
            console.error('Validation failed:', {
                issueId: !issueId ? 'missing' : 'ok',
                title: !title ? 'missing' : 'ok',
                author: !author ? 'missing' : 'ok',
                number: isNaN(number) ? 'invalid' : 'ok',
                contentFile: !contentFile ? 'missing' : 'ok',
            })
            return NextResponse.json(
                {
                    error: 'Missing required fields: issueId, title, author, number, content',
                },
                { status: 400 },
            )
        }

        // Validate .docx file
        const contentValidation = validateDocxFile(contentFile)
        console.log('Content file validation:', contentValidation)
        if (!contentValidation.valid) {
            console.error('Content file validation failed:', contentValidation.error)
            return NextResponse.json(
                { error: `Content file: ${contentValidation.error}` },
                { status: 400 },
            )
        }

        // Check if issue exists
        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
        })

        if (!issue) {
            return NextResponse.json(
                { error: 'Issue not found' },
                { status: 404 },
            )
        }

        // Check if article number already exists for this issue
        const existingArticle = await prisma.article.findUnique({
            where: {
                issueId_number: {
                    issueId,
                    number,
                },
            },
        })

        if (existingArticle) {
            return NextResponse.json(
                { error: `Article ${number} already exists in this issue` },
                { status: 409 },
            )
        }

        // Save .docx file
        const contentDocxPath = await saveDocx(contentFile, `article-${number}`)

        // Generate preview text from .docx
        const contentBuffer = Buffer.from(await contentFile.arrayBuffer())
        const previewText = await convertPreviewDocx(contentBuffer)

        // Handle image upload
        let imageUrl: string | null = null
        if (imageFile && imageFile.size > 0) {
            const validation = validateImageFile(imageFile)
            console.log('Image file validation:', validation)
            if (!validation.valid) {
                console.error('Image validation failed:', validation.error)
                return NextResponse.json(
                    { error: validation.error },
                    { status: 400 },
                )
            }

            imageUrl = await saveImage(
                imageFile,
                issue.number,
                `article-${number}`,
            )
        }

        // Generate filename
        const fileName = generateFileName(title)

        // Create article
        const article = await prisma.article.create({
            data: {
                title,
                shortTitle: shortTitle || null,
                author,
                imageArtist: imageArtist || null,
                number,
                contentDocxPath,
                previewText,
                imageUrl,
                fileName,
                published,
                issueId,
            },
        })

        return NextResponse.json(article, { status: 201 })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Error creating article:', errorMessage)
        return NextResponse.json(
            { error: 'Failed to create article', details: errorMessage },
            { status: 500 },
        )
    }
}

/**
 * GET /api/articles
 * Get all articles (optionally filter by issueId or published status)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const issueId = searchParams.get('issueId')
        const publishedParam = searchParams.get('published')

        const where: { issueId?: string; published?: boolean } = {}
        if (issueId) where.issueId = issueId
        if (publishedParam !== null) where.published = publishedParam === 'true'

        const articles = await prisma.article.findMany({
            where,
            include: {
                issue: true,
            },
            orderBy: [{ issue: { number: 'desc' } }, { number: 'asc' }],
        })

        return NextResponse.json(articles)
    } catch (error) {
        console.error('Error fetching articles:', error)
        return NextResponse.json(
            { error: 'Failed to fetch articles' },
            { status: 500 },
        )
    }
}
