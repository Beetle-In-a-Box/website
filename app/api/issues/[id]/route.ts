import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { saveImage, validateImageFile } from '@/utils/file-upload'

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

        // Update issue
        const issue = await prisma.issue.update({
            where: { id },
            data: {
                title,
                number,
                date,
                imageUrl,
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

        // Delete issue (articles will be cascade deleted)
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
