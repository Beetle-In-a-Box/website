import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { saveImage, validateImageFile } from '@/utils/file-upload'

/**
 * POST /api/issues
 * Create a new issue with optional cover image
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const title = formData.get('title') as string
        const number = parseInt(formData.get('number') as string)
        const date = formData.get('date') as string
        const published = formData.get('published') === 'true'
        const imageFile = formData.get('image') as File | null

        // Validation
        if (!title || !number || !date) {
            return NextResponse.json(
                { error: 'Missing required fields: title, number, date' },
                { status: 400 },
            )
        }

        // Check if issue number already exists
        const existingIssue = await prisma.issue.findUnique({
            where: { number },
        })

        if (existingIssue) {
            return NextResponse.json(
                { error: `Issue ${number} already exists` },
                { status: 409 },
            )
        }

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
            imageUrl = await saveImage(imageFile, number, 'issue-cover')
        }

        // Create issue
        const issue = await prisma.issue.create({
            data: {
                title,
                number,
                date,
                imageUrl,
                published,
            },
        })

        return NextResponse.json(issue, { status: 201 })
    } catch (error) {
        console.error('Error creating issue:', error)
        return NextResponse.json(
            { error: 'Failed to create issue' },
            { status: 500 },
        )
    }
}

/**
 * GET /api/issues
 * Get all issues (optionally filter by published status)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const publishedParam = searchParams.get('published')

        const where =
            publishedParam !== null
                ? { published: publishedParam === 'true' }
                : {}

        const issues = await prisma.issue.findMany({
            where,
            include: {
                articles: {
                    orderBy: { number: 'asc' },
                },
            },
            orderBy: { number: 'desc' },
        })

        return NextResponse.json(issues)
    } catch (error) {
        console.error('Error fetching issues:', error)
        return NextResponse.json(
            { error: 'Failed to fetch issues' },
            { status: 500 },
        )
    }
}
