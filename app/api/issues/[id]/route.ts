import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { verifyAuth } from '@/utils/auth'
import { saveImage, validateImageFile, savePdf, validatePdfFile, deleteFile } from '@/utils/file-upload'

/**
 * GET /api/issues/[id]
 * Get a specific issue by ID with all articles
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const issue = await prisma.issue.findUnique({
            where: { id },
            include: {
                articles: {
                    orderBy: { number: 'asc' },
                },
            },
        })

        if (!issue) {
            return NextResponse.json(
                { error: 'Issue not found' },
                { status: 404 },
            )
        }

        return NextResponse.json(issue)
    } catch (error) {
        console.error('Error fetching issue:', error)
        return NextResponse.json(
            { error: 'Failed to fetch issue' },
            { status: 500 },
        )
    }
}

/**
 * PUT /api/issues/[id]
 * Update an entire issue (replace all fields)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const formData = await request.formData()

        const title = formData.get('title') as string
        const number = parseInt(formData.get('number') as string)
        const date = formData.get('date') as string
        const published = formData.get('published') === 'true'
        const imageFile = formData.get('image') as File | null
        const pdfFile = formData.get('pdf') as File | null

        // Validation
        if (!title || !number || !date) {
            return NextResponse.json(
                { error: 'Missing required fields: title, number, date' },
                { status: 400 },
            )
        }

        // Check if issue exists
        const existingIssue = await prisma.issue.findUnique({
            where: { id },
        })

        if (!existingIssue) {
            return NextResponse.json(
                { error: 'Issue not found' },
                { status: 404 },
            )
        }

        // Check if new number conflicts with another issue
        if (number !== existingIssue.number) {
            const conflictingIssue = await prisma.issue.findUnique({
                where: { number },
            })

            if (conflictingIssue && conflictingIssue.id !== id) {
                return NextResponse.json(
                    { error: `Issue number ${number} already exists` },
                    { status: 409 },
                )
            }
        }

        // Handle image upload
        let imageUrl = existingIssue.imageUrl
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

        // Handle PDF upload
        let pdfUrl = existingIssue.pdfUrl
        if (pdfFile && pdfFile.size > 0) {
            const validation = validatePdfFile(pdfFile)
            if (!validation.valid) {
                return NextResponse.json(
                    { error: validation.error },
                    { status: 400 },
                )
            }
            pdfUrl = await savePdf(pdfFile, `issue-${number}`)
        }

        // Update issue
        const issue = await prisma.issue.update({
            where: { id },
            data: {
                title,
                number,
                date,
                imageUrl,
                pdfUrl,
                published,
            },
            include: {
                articles: {
                    orderBy: { number: 'asc' },
                },
            },
        })

        return NextResponse.json(issue)
    } catch (error) {
        console.error('Error updating issue:', error)
        return NextResponse.json(
            { error: 'Failed to update issue' },
            { status: 500 },
        )
    }
}

/**
 * PATCH /api/issues/[id]
 * Partially update an issue (e.g., toggle published status)
 */
export async function PATCH(
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

        // Parse FormData
        const formData = await request.formData()
        const body: Record<string, string | boolean | File> = {}

        formData.forEach((value, key) => {
            // Convert 'true'/'false' strings to booleans
            if (value === 'true') body[key] = true
            else if (value === 'false') body[key] = false
            else body[key] = value as string | File
        })

        console.log('Parsed body:', body)

        // Check if issue exists
        const existingIssue = await prisma.issue.findUnique({
            where: { id },
        })

        if (!existingIssue) {
            return NextResponse.json(
                { error: 'Issue not found' },
                { status: 404 },
            )
        }

        // Update only provided fields
        const issue = await prisma.issue.update({
            where: { id },
            data: body,
            include: {
                articles: {
                    orderBy: { number: 'asc' },
                },
            },
        })

        return NextResponse.json(issue)
    } catch (error) {
        console.error('Error patching issue:', error)
        return NextResponse.json(
            { error: 'Failed to update issue' },
            { status: 500 },
        )
    }
}

/**
 * DELETE /api/issues/[id]
 * Delete an issue and all its articles (cascade)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const issue = await prisma.issue.findUnique({
            where: { id },
            include: { articles: true },
        })

        if (!issue) {
            return NextResponse.json(
                { error: 'Issue not found' },
                { status: 404 },
            )
        }

        // Delete all article files
        for (const article of issue.articles) {
            await deleteFile(article.imageUrl)
            await deleteFile(article.contentDocxPath)
        }

        // Delete issue image and PDF
        await deleteFile(issue.imageUrl)
        await deleteFile(issue.pdfUrl)

        // Delete issue (articles will be cascade deleted from database)
        await prisma.issue.delete({
            where: { id },
        })

        return NextResponse.json(
            { message: `Issue ${issue.number} deleted successfully` },
            { status: 200 },
        )
    } catch (error) {
        console.error('Error deleting issue:', error)
        return NextResponse.json(
            { error: 'Failed to delete issue' },
            { status: 500 },
        )
    }
}
