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
 * POST /api/articles
 * Create a new article with .docx files for content, citations, and preview
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()

        const issueId = formData.get('issueId') as string
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
        if (
            !issueId ||
            !title ||
            !author ||
            !number ||
            !contentFile ||
            !previewFile
        ) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: issueId, title, author, number, content, preview',
                },
                { status: 400 },
            )
        }

        // Validate .docx files
        const contentValidation = validateDocxFile(contentFile)
        if (!contentValidation.valid) {
            return NextResponse.json(
                { error: `Content file: ${contentValidation.error}` },
                { status: 400 },
            )
        }

        const previewValidation = validateDocxFile(previewFile)
        if (!previewValidation.valid) {
            return NextResponse.json(
                { error: `Preview file: ${previewValidation.error}` },
                { status: 400 },
            )
        }

        if (citationsFile && citationsFile.size > 0) {
            const citationsValidation = validateDocxFile(citationsFile)
            if (!citationsValidation.valid) {
                return NextResponse.json(
                    { error: `Citations file: ${citationsValidation.error}` },
                    { status: 400 },
                )
            }
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

        // Process .docx files
        const contentBuffer = Buffer.from(await contentFile.arrayBuffer())
        const content = await convertArticleDocx(contentBuffer)

        let citations = ''
        if (citationsFile && citationsFile.size > 0) {
            const citationsBuffer = Buffer.from(
                await citationsFile.arrayBuffer(),
            )
            citations = await convertCitationsDocx(citationsBuffer)
        }

        const previewBuffer = Buffer.from(await previewFile.arrayBuffer())
        const previewText = await convertPreviewDocx(previewBuffer)

        // Handle image upload
        let imageUrl: string | null = null
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
                number,
                content,
                citations,
                previewText,
                imageUrl,
                fileName,
                published,
                issueId,
            },
        })

        return NextResponse.json(article, { status: 201 })
    } catch (error) {
        console.error('Error creating article:', error)
        return NextResponse.json(
            { error: 'Failed to create article' },
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
