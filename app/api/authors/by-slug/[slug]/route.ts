import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        const author = await prisma.author.findUnique({
            where: { slug },
            include: {
                articles: {
                    where: { published: true },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        issue: true,
                    },
                },
            },
        })

        if (!author) {
            return NextResponse.json(
                { error: 'Author not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(author)
    } catch (error) {
        console.error('Error fetching author:', error)
        return NextResponse.json(
            { error: 'Failed to fetch author' },
            { status: 500 }
        )
    }
}
