import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { generateAuthorSlug } from '@/utils/author-utils'

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
        const body = await request.json()
        const { name } = body

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: 'Author name is required' },
                { status: 400 }
            )
        }

        const author = await prisma.author.create({
            data: {
                name: name.trim(),
                slug: generateAuthorSlug(name.trim(), ''),
            },
        })

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
