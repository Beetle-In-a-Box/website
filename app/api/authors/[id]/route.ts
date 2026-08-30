import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { verifyAuth } from '@/utils/auth'
import { generateAuthorSlug } from '@/utils/author-utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const author = await prisma.author.findUnique({
            where: { id },
            include: {
                articles: {
                    where: { published: true },
                    orderBy: { number: 'asc' },
                    include: {
                        issue: true,
                    },
                },
                _count: {
                    select: { articles: true },
                },
            },
        })

        if (!author) {
            return NextResponse.json(
                { error: 'Author not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(author, { status: 200 })
    } catch (error) {
        console.error('Error fetching author:', error)
        return NextResponse.json(
            { error: 'Failed to fetch author' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('admin-token')?.value
        const isAuthenticated = await verifyAuth(token)
        if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { name, bio } = body

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: 'Author name is required' },
                { status: 400 }
            )
        }

        // Check if author exists
        const existingAuthor = await prisma.author.findUnique({
            where: { id },
        })

        if (!existingAuthor) {
            return NextResponse.json(
                { error: 'Author not found' },
                { status: 404 }
            )
        }

        const author = await prisma.author.update({
            where: { id },
            data: {
                name: name.trim(),
                slug: generateAuthorSlug(name.trim(), id),
                ...(bio !== undefined && {
                    bio: typeof bio === 'string' ? bio.trim() || null : null,
                }),
            },
        })

        return NextResponse.json(author, { status: 200 })
    } catch (error) {
        console.error('Error updating author:', error)

        if ((error as { code?: string })?.code === 'P2002') {
            return NextResponse.json(
                { error: 'An author with this name already exists' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to update author' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('admin-token')?.value
        const isAuthenticated = await verifyAuth(token)
        if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const author = await prisma.author.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        })

        if (!author) {
            return NextResponse.json(
                { error: 'Author not found' },
                { status: 404 }
            )
        }

        // Prevent deletion if author has articles
        if (author._count.articles > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete author with existing articles. Remove articles first.',
                },
                { status: 409 }
            )
        }

        await prisma.author.delete({
            where: { id },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting author:', error)
        return NextResponse.json(
            { error: 'Failed to delete author' },
            { status: 500 }
        )
    }
}
