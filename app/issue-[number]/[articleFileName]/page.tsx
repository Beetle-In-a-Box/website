import { notFound } from 'next/navigation'
import Image from 'next/image'
import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'
import MainContainer from '@/components/layout/MainContainer'
import ArticleContainer from '@/components/article/ArticleContainer'
import ArticleTitle from '@/components/article/ArticleTitle'
import ArticleAuthor from '@/components/article/ArticleAuthor'
import ArticleContent from '@/components/article/ArticleContent'
import { prisma } from '@/utils/prisma'

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

    return (
        <MainContainer>
            <NavBar date={article.issue.date} />
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
                    {/* Render article content as HTML */}
                    <div
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                    {/* Render citations if available */}
                    {article.citations && (
                        <>
                            <div className="footnoteBorder"></div>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: article.citations,
                                }}
                            />
                        </>
                    )}
                </ArticleContent>
            </ArticleContainer>
            <FloatingBar showAbout={true} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
