import { POST, GET } from '@/app/api/articles/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/articles/[id]/route'
import { prismaMock } from '@/utils/prisma-test'
import { NextRequest } from 'next/server'
import * as fileUpload from '@/utils/file-upload'
import * as docxUtils from '@/utils/docx-utils'

// Mock file upload and docx utilities
jest.mock('@/utils/file-upload', () => ({
    saveImage: jest.fn().mockResolvedValue('/Issue-1/Images/test-article.jpg'),
    validateImageFile: jest.fn().mockReturnValue({ valid: true }),
    validateDocxFile: jest.fn().mockReturnValue({ valid: true }),
}))

jest.mock('@/utils/docx-utils', () => ({
    convertArticleDocx: jest.fn().mockResolvedValue('<p>Article content</p>'),
    convertCitationsDocx: jest
        .fn()
        .mockResolvedValue('<p class="footnote">Citation 1</p>'),
    convertPreviewDocx: jest.fn().mockResolvedValue('Article preview text'),
    generateFileName: jest.fn().mockReturnValue('test-article.html'),
}))

describe('Articles API', () => {
    const mockIssue = {
        id: 'issue-1',
        title: 'Issue 1',
        number: 1,
        date: 'August 2025',
        imageUrl: null,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/articles', () => {
        it('should create a new article with all fields', async () => {
            const mockArticle = {
                id: 'article-1',
                title: 'Test Article',
                shortTitle: 'Short',
                author: 'John Doe',
                number: 1,
                content: '<p>Article content</p>',
                citations: '<p class="footnote">Citation 1</p>',
                previewText: 'Article preview text',
                imageUrl: '/Issue-1/Images/test-article.jpg',
                fileName: 'test-article.html',
                published: false,
                issueId: 'issue-1',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            prismaMock.issue.findUnique.mockResolvedValue(mockIssue)
            prismaMock.article.findUnique.mockResolvedValue(null)
            prismaMock.article.create.mockResolvedValue(mockArticle)

            const formData = new FormData()
            formData.append('issueId', 'issue-1')
            formData.append('title', 'Test Article')
            formData.append('shortTitle', 'Short')
            formData.append('author', 'John Doe')
            formData.append('number', '1')
            formData.append('published', 'false')
            formData.append(
                'content',
                new File(['content'], 'content.docx', {
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                }),
            )
            formData.append(
                'citations',
                new File(['citations'], 'citations.docx', {
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                }),
            )
            formData.append(
                'preview',
                new File(['preview'], 'preview.docx', {
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                }),
            )
            formData.append(
                'image',
                new File(['image'], 'article.jpg', { type: 'image/jpeg' }),
            )

            const request = new NextRequest(
                'http://localhost:3000/api/articles',
                {
                    method: 'POST',
                    body: formData,
                },
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(201)
            expect(data.title).toBe('Test Article')
            expect(data.author).toBe('John Doe')
            expect(docxUtils.convertArticleDocx).toHaveBeenCalled()
            expect(docxUtils.convertCitationsDocx).toHaveBeenCalled()
            expect(docxUtils.convertPreviewDocx).toHaveBeenCalled()
            expect(fileUpload.saveImage).toHaveBeenCalled()
        })

        it('should create article without optional fields (citations, image, shortTitle)', async () => {
            const mockArticle = {
                id: 'article-1',
                title: 'Test Article',
                shortTitle: null,
                author: 'John Doe',
                number: 1,
                content: '<p>Article content</p>',
                citations: null,
                previewText: 'Article preview text',
                imageUrl: null,
                fileName: 'test-article.html',
                published: false,
                issueId: 'issue-1',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            prismaMock.issue.findUnique.mockResolvedValue(mockIssue)
            prismaMock.article.findUnique.mockResolvedValue(null)
            prismaMock.article.create.mockResolvedValue(mockArticle)

            const formData = new FormData()
            formData.append('issueId', 'issue-1')
            formData.append('title', 'Test Article')
            formData.append('author', 'John Doe')
            formData.append('number', '1')
            formData.append('content', new File(['content'], 'content.docx'))
            formData.append('preview', new File(['preview'], 'preview.docx'))

            const request = new NextRequest(
                'http://localhost:3000/api/articles',
                {
                    method: 'POST',
                    body: formData,
                },
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(201)
            expect(data.citations).toBeNull()
            expect(data.imageUrl).toBeNull()
            expect(fileUpload.saveImage).not.toHaveBeenCalled()
        })

        it('should return 404 if issue not found', async () => {
            prismaMock.issue.findUnique.mockResolvedValue(null)

            const formData = new FormData()
            formData.append('issueId', 'nonexistent')
            formData.append('title', 'Test Article')
            formData.append('author', 'John Doe')
            formData.append('number', '1')
            formData.append('content', new File(['content'], 'content.docx'))
            formData.append('preview', new File(['preview'], 'preview.docx'))

            const request = new NextRequest(
                'http://localhost:3000/api/articles',
                {
                    method: 'POST',
                    body: formData,
                },
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toContain('Issue not found')
        })

        it('should return 409 if article number already exists in issue', async () => {
            const existingArticle = {
                id: 'article-1',
                title: 'Existing Article',
                shortTitle: null,
                author: 'Jane Doe',
                number: 1,
                content: '<p>Content</p>',
                citations: null,
                previewText: 'Preview',
                imageUrl: null,
                fileName: 'existing-article.html',
                published: true,
                issueId: 'issue-1',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            prismaMock.issue.findUnique.mockResolvedValue(mockIssue)
            prismaMock.article.findUnique.mockResolvedValue(existingArticle)

            const formData = new FormData()
            formData.append('issueId', 'issue-1')
            formData.append('title', 'Test Article')
            formData.append('author', 'John Doe')
            formData.append('number', '1')
            formData.append('content', new File(['content'], 'content.docx'))
            formData.append('preview', new File(['preview'], 'preview.docx'))

            const request = new NextRequest(
                'http://localhost:3000/api/articles',
                {
                    method: 'POST',
                    body: formData,
                },
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(409)
            expect(data.error).toContain('already exists')
        })

        it('should return 400 if required fields are missing', async () => {
            const formData = new FormData()
            formData.append('issueId', 'issue-1')
            formData.append('title', 'Test Article')
            // Missing author, number, content, preview

            const request = new NextRequest(
                'http://localhost:3000/api/articles',
                {
                    method: 'POST',
                    body: formData,
                },
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('Missing required fields')
        })

        it('should return 400 if image validation fails', async () => {
            ;(fileUpload.validateImageFile as jest.Mock).mockReturnValueOnce({
                valid: false,
                error: 'File must be an image (JPEG, PNG, GIF, or WebP)',
            })

            prismaMock.issue.findUnique.mockResolvedValue(mockIssue)
            prismaMock.article.findUnique.mockResolvedValue(null)

            const formData = new FormData()
            formData.append('issueId', 'issue-1')
            formData.append('title', 'Test Article')
            formData.append('author', 'John Doe')
            formData.append('number', '1')
            formData.append('content', new File(['content'], 'content.docx'))
            formData.append('preview', new File(['preview'], 'preview.docx'))
            formData.append(
                'image',
                new File(['not an image'], 'doc.pdf', {
                    type: 'application/pdf',
                }),
            )

            const request = new NextRequest(
                'http://localhost:3000/api/articles',
                {
                    method: 'POST',
                    body: formData,
                },
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('must be an image')
        })
    })

    describe('GET /api/articles', () => {
        it('should return all articles', async () => {
            const mockArticles = [
                {
                    id: 'article-1',
                    title: 'Test Article',
                    shortTitle: null,
                    author: 'John Doe',
                    number: 1,
                    content: '<p>Content</p>',
                    citations: null,
                    previewText: 'Preview',
                    imageUrl: null,
                    fileName: 'test-article.html',
                    published: true,
                    issueId: 'issue-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    issue: mockIssue,
                },
            ]

            prismaMock.article.findMany.mockResolvedValue(mockArticles)

            const request = new NextRequest(
                'http://localhost:3000/api/articles',
            )

            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data[0].title).toBe('Test Article')
        })

        it('should filter by issueId', async () => {
            prismaMock.article.findMany.mockResolvedValue([])

            const request = new NextRequest(
                'http://localhost:3000/api/articles?issueId=issue-1',
            )

            const response = await GET(request)

            expect(response.status).toBe(200)
            expect(prismaMock.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ issueId: 'issue-1' }),
                }),
            )
        })

        it('should filter by published status', async () => {
            prismaMock.article.findMany.mockResolvedValue([])

            const request = new NextRequest(
                'http://localhost:3000/api/articles?published=true',
            )

            const response = await GET(request)

            expect(response.status).toBe(200)
            expect(prismaMock.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ published: true }),
                }),
            )
        })

        it('should filter by both issueId and published status', async () => {
            prismaMock.article.findMany.mockResolvedValue([])

            const request = new NextRequest(
                'http://localhost:3000/api/articles?issueId=issue-1&published=true',
            )

            const response = await GET(request)

            expect(response.status).toBe(200)
            expect(prismaMock.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        issueId: 'issue-1',
                        published: true,
                    }),
                }),
            )
        })
    })

    describe('GET /api/articles/[id]', () => {
        it('should return a specific article', async () => {
            const mockArticle = {
                id: 'article-1',
                title: 'Test Article',
                shortTitle: null,
                author: 'John Doe',
                number: 1,
                content: '<p>Content</p>',
                citations: null,
                previewText: 'Preview',
                imageUrl: null,
                fileName: 'test-article.html',
                published: true,
                issueId: 'issue-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                issue: mockIssue,
            }

            prismaMock.article.findUnique.mockResolvedValue(mockArticle)

            const request = new NextRequest(
                'http://localhost:3000/api/articles/article-1',
            )

            const response = await GET_BY_ID(request, {
                params: { id: 'article-1' },
            })
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.id).toBe('article-1')
            expect(data.title).toBe('Test Article')
        })

        it('should return 404 if article not found', async () => {
            prismaMock.article.findUnique.mockResolvedValue(null)

            const request = new NextRequest(
                'http://localhost:3000/api/articles/nonexistent',
            )

            const response = await GET_BY_ID(request, {
                params: { id: 'nonexistent' },
            })
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toContain('not found')
        })
    })

    describe('PUT /api/articles/[id]', () => {
        it('should update article without changing files', async () => {
            const existingArticle = {
                id: 'article-1',
                title: 'Test Article',
                shortTitle: null,
                author: 'John Doe',
                number: 1,
                content: '<p>Content</p>',
                citations: null,
                previewText: 'Preview',
                imageUrl: null,
                fileName: 'test-article.html',
                published: false,
                issueId: 'issue-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                issue: mockIssue,
            }

            const updatedArticle = {
                ...existingArticle,
                title: 'Updated Article',
                published: true,
            }

            prismaMock.article.findUnique.mockResolvedValue(existingArticle)
            prismaMock.article.update.mockResolvedValue(updatedArticle)

            const formData = new FormData()
            formData.append('title', 'Updated Article')
            formData.append('author', 'John Doe')
            formData.append('number', '1')
            formData.append('published', 'true')

            const request = new NextRequest(
                'http://localhost:3000/api/articles/article-1',
                {
                    method: 'PUT',
                    body: formData,
                },
            )

            const response = await PUT(request, { params: { id: 'article-1' } })
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.title).toBe('Updated Article')
            expect(data.published).toBe(true)
        })

        it('should update article with new content file', async () => {
            const existingArticle = {
                id: 'article-1',
                title: 'Test Article',
                shortTitle: null,
                author: 'John Doe',
                number: 1,
                content: '<p>Old content</p>',
                citations: null,
                previewText: 'Old preview',
                imageUrl: null,
                fileName: 'test-article.html',
                published: false,
                issueId: 'issue-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                issue: mockIssue,
            }

            const updatedArticle = {
                ...existingArticle,
                content: '<p>Article content</p>',
            }

            prismaMock.article.findUnique.mockResolvedValue(existingArticle)
            prismaMock.article.update.mockResolvedValue(updatedArticle)

            const formData = new FormData()
            formData.append('title', 'Test Article')
            formData.append('author', 'John Doe')
            formData.append('number', '1')
            formData.append(
                'content',
                new File(['new content'], 'content.docx'),
            )

            const request = new NextRequest(
                'http://localhost:3000/api/articles/article-1',
                {
                    method: 'PUT',
                    body: formData,
                },
            )

            const response = await PUT(request, { params: { id: 'article-1' } })

            expect(response.status).toBe(200)
            expect(docxUtils.convertArticleDocx).toHaveBeenCalled()
        })

        it('should update article with new image', async () => {
            const existingArticle = {
                id: 'article-1',
                title: 'Test Article',
                shortTitle: null,
                author: 'John Doe',
                number: 1,
                content: '<p>Content</p>',
                citations: null,
                previewText: 'Preview',
                imageUrl: '/Issue-1/Images/old-image.jpg',
                fileName: 'test-article.html',
                published: false,
                issueId: 'issue-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                issue: mockIssue,
            }

            const updatedArticle = {
                ...existingArticle,
                imageUrl: '/Issue-1/Images/test-article.jpg',
            }

            prismaMock.article.findUnique.mockResolvedValue(existingArticle)
            prismaMock.article.update.mockResolvedValue(updatedArticle)

            const formData = new FormData()
            formData.append('title', 'Test Article')
            formData.append('author', 'John Doe')
            formData.append('number', '1')
            formData.append(
                'image',
                new File(['new image'], 'new-image.jpg', {
                    type: 'image/jpeg',
                }),
            )

            const request = new NextRequest(
                'http://localhost:3000/api/articles/article-1',
                {
                    method: 'PUT',
                    body: formData,
                },
            )

            const response = await PUT(request, { params: { id: 'article-1' } })

            expect(response.status).toBe(200)
            expect(fileUpload.validateImageFile).toHaveBeenCalled()
            expect(fileUpload.saveImage).toHaveBeenCalled()
        })

        it('should return 404 if article not found', async () => {
            prismaMock.article.findUnique.mockResolvedValue(null)

            const formData = new FormData()
            formData.append('title', 'Updated Article')
            formData.append('author', 'John Doe')
            formData.append('number', '1')

            const request = new NextRequest(
                'http://localhost:3000/api/articles/nonexistent',
                {
                    method: 'PUT',
                    body: formData,
                },
            )

            const response = await PUT(request, {
                params: { id: 'nonexistent' },
            })
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toContain('not found')
        })
    })

    describe('DELETE /api/articles/[id]', () => {
        it('should delete an article', async () => {
            const mockArticle = {
                id: 'article-1',
                title: 'Test Article',
                shortTitle: null,
                author: 'John Doe',
                number: 1,
                content: '<p>Content</p>',
                citations: null,
                previewText: 'Preview',
                imageUrl: null,
                fileName: 'test-article.html',
                published: false,
                issueId: 'issue-1',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            prismaMock.article.findUnique.mockResolvedValue(mockArticle)
            prismaMock.article.delete.mockResolvedValue(mockArticle)

            const request = new NextRequest(
                'http://localhost:3000/api/articles/article-1',
            )

            const response = await DELETE(request, {
                params: { id: 'article-1' },
            })
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.message).toContain('deleted successfully')
        })

        it('should return 404 if article not found', async () => {
            prismaMock.article.findUnique.mockResolvedValue(null)

            const request = new NextRequest(
                'http://localhost:3000/api/articles/nonexistent',
            )

            const response = await DELETE(request, {
                params: { id: 'nonexistent' },
            })
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toContain('not found')
        })
    })
})
