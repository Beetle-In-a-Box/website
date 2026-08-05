import { notFound } from 'next/navigation'
import { readFile } from 'fs/promises'
import { join } from 'path'
import PageLayout from '@/components/layout/PageLayout'
import ArticleContainer from '@/components/article/ArticleContainer'
import ArticleTitle from '@/components/article/ArticleTitle'
import ArticleAuthor from '@/components/article/ArticleAuthor'
import ArticleContent from '@/components/article/ArticleContent'
import ArticleHtmlContent from '@/components/article/ArticleHtmlContent'
import FootnoteHandler from '@/components/article/FootnoteHandler'
import CoverImage from '@/components/ui/CoverImage'
import { prisma } from '@/utils/prisma'
import { convertArticleDocx } from '@/utils/docx-utils'
import { formatIssueDate } from '@/utils/date-utils'
import styles from './page.module.scss'

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
            include: {
                issue: true,
                author: true,
            },
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
        const relativePath = docxPath.startsWith('/')
            ? docxPath.slice(1)
            : docxPath
        const filePath = join(process.cwd(), 'uploads', relativePath)
        const buffer = await readFile(filePath)

        // Convert to HTML with footnote handling (returns { content, citations })
        return await convertArticleDocx(buffer)
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

    if (isNaN(issueNumber)) {
        notFound()
    }

    const article = await getArticle(issueNumber, articleFileName)

    if (!article || !article.issue.published) {
        notFound()
    }

    // Convert the .docx file to HTML on-the-fly
    const { content, citations } = await convertDocxToHtml(
        article.contentDocxPath
    )

    const issueDate = formatIssueDate(article.issue.date)

    return (
        <PageLayout date={issueDate} showAbout={true} showLatest={true}>
            <FootnoteHandler />
            <ArticleContainer>
                <ArticleTitle title={article.title} />
                <ArticleAuthor author={article.author} role="Staff Writer" />
                {article.imageUrl && (
                    <div className={styles.imageWrapper}>
                        <CoverImage
                            src={article.imageUrl}
                            alt={article.title}
                            sizes="(max-width: 700px) 90vw, 600px"
                            fit="contain"
                            priority
                            linkToFullRes
                        />
                        {article.imageArtist && (
                            <div className={styles.imageArtist}>
                                Art by {article.imageArtist}
                            </div>
                        )}
                    </div>
                )}
                <ArticleContent>
                    {/* Render article content as React components */}
                    <ArticleHtmlContent html={content} />
                    {/* Render citations if available */}
                    {citations && (
                        <>
                            <div className={styles.footnoteBorder}></div>
                            <ArticleHtmlContent html={citations} />
                        </>
                    )}
                </ArticleContent>
            </ArticleContainer>
        </PageLayout>
    )
}
