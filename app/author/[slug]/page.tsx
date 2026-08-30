import { notFound } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import ContentsContainer from '@/components/issue/ContentsContainer'
import ArticlePreview from '@/components/issue/ArticlePreview'
import Empty from '@/components/ui/Empty'
import { prisma } from '@/utils/prisma'
import { formatIssueDate } from '@/utils/date-utils'

export const dynamic = 'force-dynamic'

async function getAuthorBySlug(slug: string) {
    try {
        return await prisma.author.findUnique({
            where: { slug },
            include: {
                articles: {
                    where: { published: true },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        issue: true,
                        author: true,
                    },
                },
            },
        })
    } catch (error) {
        console.error('Error fetching author:', error)
        return null
    }
}

async function getLatestIssue() {
    try {
        return await prisma.issue.findFirst({
            where: { published: true },
            orderBy: { number: 'desc' },
        })
    } catch (error) {
        console.error('Error fetching latest issue:', error)
        return null
    }
}

export default async function AuthorPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const resolvedParams = await params
    const author = await getAuthorBySlug(resolvedParams.slug)

    if (!author) {
        notFound()
    }

    // Get the latest issue's date for the header
    const latestIssue = await getLatestIssue()
    const issueDate = latestIssue ? formatIssueDate(latestIssue.date) : undefined

    if (author.articles.length === 0) {
        return (
            <PageLayout clickable={true} date={issueDate} showAbout={true}>
                <ContentsContainer title={`${author.name}`}>
                    <Empty>No published articles by this author yet.</Empty>
                </ContentsContainer>
            </PageLayout>
        )
    }

    return (
        <PageLayout clickable={true} date={issueDate} showAbout={true}>
            <ContentsContainer title={`${author.name}`}>
                <div className="text contents previewContainer">
                    {author.articles.map(article => (
                        <ArticlePreview
                            key={article.id}
                            id={article.id}
                            title={article.title}
                            author={{
                                name: article.author?.name || 'Unknown',
                                slug: article.author?.slug || '',
                            }}
                            previewText={article.previewText}
                            imageUrl={
                                article.imageUrl ||
                                '/default-article-cover.png'
                            }
                            articleUrl={`/issue/${article.issue?.number}/${article.fileName}`}
                            imageArtist={article.imageArtist || undefined}
                        />
                    ))}
                </div>
            </ContentsContainer>
        </PageLayout>
    )
}
