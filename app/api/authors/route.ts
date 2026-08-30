import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { verifyAuth } from '@/utils/auth'
import { createAuthorWithSlug } from '@/utils/author-utils'

export async function GET() {
    try {
        const authors = await prisma.author.findMany({
            include: {
                _count: {
                    select: { articles: true },
                },
            },
            orderBy: { name: 'asc' },
        })
        return NextResponse.json(authors, { status: 200 })
    } catch (error) {
        console.error('Error fetching authors:', error)
        return NextResponse.json(
            { error: 'Failed to fetch authors' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('admin-token')?.value
        const isAuthenticated = await verifyAuth(token)
        if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, bio } = body

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: 'Author name is required' },
                { status: 400 }
            )
        }

        const author = await createAuthorWithSlug(
            prisma,
            name.trim(),
            typeof bio === 'string' ? bio.trim() || null : null
        )

        return NextResponse.json(author, { status: 201 })
    } catch (error) {
        console.error('Error creating author:', error)

        // Check if slug already exists (unique constraint)
        if ((error as { code?: string })?.code === 'P2002') {
            return NextResponse.json(
                { error: 'An author with this name already exists' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create author' },
            { status: 500 }
        )
    }
}
