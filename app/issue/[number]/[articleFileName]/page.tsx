import { notFound } from 'next/navigation'
import Image from 'next/image'
import { readFile } from 'fs/promises'
import { join } from 'path'
import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'
import MainContainer from '@/components/layout/MainContainer'
import ArticleContainer from '@/components/article/ArticleContainer'
import ArticleTitle from '@/components/article/ArticleTitle'
import ArticleAuthor from '@/components/article/ArticleAuthor'
import ArticleContent from '@/components/article/ArticleContent'
import ArticleHtmlContent from '@/components/article/ArticleHtmlContent'
import FootnoteHandler from '@/components/article/FootnoteHandler'
import { prisma } from '@/utils/prisma'
import { convertArticleDocx } from '@/utils/docx-utils'
import mammoth from 'mammoth'

interface ArticlePageProps {
    params: Promise<{
        number: string
        articleFileName: string
    }>
}

async function getArticle(issueNumber: number, articleFileName: string) {
    try {
        const article = await prisma.article.findFirst({
            where: {
                fileName: articleFileName,
                issue: { number: issueNumber },
                published: true,
            },
            include: { issue: true },
        })
        return article
    } catch (error) {
        console.error('Error fetching article:', error)
        return null
    }
}

async function convertDocxToHtml(docxPath: string) {
    try {
        // Read the .docx file from uploads directory
        // docxPath is like '/articles/file.docx', remove leading slash
        const relativePath = docxPath.startsWith('/') ? docxPath.slice(1) : docxPath
        const filePath = join(process.cwd(), 'uploads', relativePath)
        const buffer = await readFile(filePath)

        // Convert to HTML with footnote handling
        const content = await convertArticleDocx(buffer)

        // Extract endnotes/footnotes if they exist
        // mammoth converts endnotes as part of the document
        // We need to split content from citations
        const result = await mammoth.convertToHtml({ buffer })
        const fullHtml = result.value

        // Check if there are footnotes (indicated by <sup> tags)
        const hasCitations = fullHtml.includes('<sup>')

        if (hasCitations) {
            // For now, return the full content
            // TODO: Properly split main content from endnotes
            return { content, citations: null }
        }

        return { content, citations: null }
    } catch (error) {
        console.error('Error converting .docx:', error)
        return {
            content: '<p>Error loading article content</p>',
            citations: null,
        }
    }
}

export async function generateStaticParams() {
    try {
        const articles = await prisma.article.findMany({
            where: { published: true },
            select: {
                fileName: true,
                issue: {
                    select: { number: true },
                },
            },
        })

        return articles.map(article => ({
            number: article.issue.number.toString(),
            articleFileName: article.fileName,
        }))
    } catch (error) {
        console.error('Error generating static params:', error)
        return []
    }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const resolvedParams = await params
    const issueNumber = parseInt(resolvedParams.number, 10)
    const articleFileName = resolvedParams.articleFileName

    console.log('Article page params:', { issueNumber, articleFileName })

    if (isNaN(issueNumber)) {
        console.log('Invalid issue number')
        notFound()
    }

    const article = await getArticle(issueNumber, articleFileName)
    console.log('Article found:', article ? article.title : 'null')

    if (!article || !article.issue.published) {
        notFound()
    }

    // Convert the .docx file to HTML on-the-fly
    const { content, citations } = await convertDocxToHtml(
        article.contentDocxPath
    )

    return (
        <MainContainer>
            <FootnoteHandler />
            <NavBar />
            <ArticleContainer>
                <ArticleTitle title={article.title} />
                <ArticleAuthor author={article.author} role="Staff Writer" />
                {article.imageUrl && (
                    <Image
                        src={article.imageUrl}
                        alt={article.title}
                        width={800}
                        height={600}
                        style={{ width: '100%', height: 'auto' }}
                    />
                )}
                <ArticleContent>
                    {/* Render article content as React components */}
                    <ArticleHtmlContent html={content} />
                    {/* Render citations if available */}
                    {citations && (
                        <>
                            <div className="footnoteBorder"></div>
                            <ArticleHtmlContent html={citations} />
                        </>
                    )}
                </ArticleContent>
            </ArticleContainer>
            <FloatingBar showAbout={true} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
