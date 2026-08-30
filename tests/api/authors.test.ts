import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test'
import { POST } from '@/app/api/authors/route'
import { PATCH } from '@/app/api/authors/[id]/route'
import { prismaMock } from '@/utils/prisma-test'
import { NextRequest } from 'next/server'
import * as authUtils from '@/utils/auth'
import { restoreMocks } from '../mock-utils'

// prisma-test.ts predates the Author model, so the shared mock has no
// `author` delegate or `$transaction`. Extend it here so createAuthorWithSlug
// (used by POST, which runs inside prisma.$transaction) and PATCH's
// prisma.author.findUnique/update calls don't crash.
const prismaMockWithAuthor = prismaMock as unknown as {
    author: {
        findUnique: ReturnType<typeof mock>
        create: ReturnType<typeof mock>
        findFirst: ReturnType<typeof mock>
        update: ReturnType<typeof mock>
    }
    $transaction: ReturnType<typeof mock>
}
prismaMockWithAuthor.author = {
    findUnique: mock(),
    create: mock(),
    findFirst: mock(),
    update: mock(),
}
prismaMockWithAuthor.$transaction = mock()

function makeMockAuthor(overrides: Record<string, unknown> = {}) {
    return {
        id: 'author-1',
        name: 'Test Author',
        slug: 'test-author-abc123',
        bio: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }
}

describe('Authors API', () => {
    afterEach(() => {
        restoreMocks(authUtils.verifyAuth)
    })

    beforeEach(() => {
        prismaMockWithAuthor.author.findUnique.mockReset()
        prismaMockWithAuthor.author.create.mockReset()
        prismaMockWithAuthor.author.findFirst.mockReset()
        prismaMockWithAuthor.author.update.mockReset()
        prismaMockWithAuthor.$transaction.mockReset()

        // POST/PATCH require authentication; default to authenticated
        spyOn(authUtils, 'verifyAuth').mockResolvedValue(true)

        // createAuthorWithSlug runs its logic inside prisma.$transaction —
        // simulate that by invoking the passed callback with a tx object
        // backed by the same author mocks.
        prismaMockWithAuthor.$transaction.mockImplementation(
            async (fn: (tx: unknown) => unknown) => fn(prismaMockWithAuthor),
        )
    })

    describe('POST /api/authors', () => {
        it('creates an author with a bio', async () => {
            prismaMockWithAuthor.author.create.mockResolvedValue(
                makeMockAuthor({ slug: 'pending-slug' }),
            )
            // No slug clash on the first attempt
            prismaMockWithAuthor.author.findFirst.mockResolvedValue(null)
            prismaMockWithAuthor.author.update.mockResolvedValue(
                makeMockAuthor({ bio: 'Writes about beetles.' }),
            )

            const request = new NextRequest(
                'http://localhost:3000/api/authors',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Test Author',
                        bio: 'Writes about beetles.',
                    }),
                },
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(201)
            expect(data.bio).toBe('Writes about beetles.')
            expect(prismaMockWithAuthor.author.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        bio: 'Writes about beetles.',
                    }),
                }),
            )
        })
    })

    describe('PATCH /api/authors/[id]', () => {
        it('updates an author bio', async () => {
            prismaMockWithAuthor.author.findUnique.mockResolvedValue(
                makeMockAuthor(),
            )
            prismaMockWithAuthor.author.update.mockResolvedValue(
                makeMockAuthor({ bio: 'New bio' }),
            )

            const request = new NextRequest(
                'http://localhost:3000/api/authors/author-1',
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Test Author',
                        bio: 'New bio',
                    }),
                },
            )

            const response = await PATCH(request, {
                params: Promise.resolve({ id: 'author-1' }),
            })
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.bio).toBe('New bio')
            expect(prismaMockWithAuthor.author.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ bio: 'New bio' }),
                }),
            )
        })
    })
})
