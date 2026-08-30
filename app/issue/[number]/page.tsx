import { notFound } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import ContentsContainer from '@/components/issue/ContentsContainer'
import IssueCover from '@/components/issue/IssueCover'
import CoverImage from '@/components/ui/CoverImage'
import ArticlePreview from '@/components/issue/ArticlePreview'
import Empty from '@/components/ui/Empty'
import { prisma } from '@/utils/prisma'
import { formatIssueDate } from '@/utils/date-utils'
import { getLatestIssueNumber } from '@/utils/issue-utils'

// Always fetch fresh data - don't cache this page
export const dynamic = 'force-dynamic'

async function getIssueByNumber(number: number) {
    try {
        const issue = await prisma.issue.findFirst({
            where: {
                number: number,
                published: true,
            },
            include: {
                articles: {
                    where: { published: true },
                    orderBy: { number: 'asc' },
                    include: {
                        author: true,
                    },
                },
            },
        })
        return issue
    } catch (error) {
        console.error('Error fetching issue:', error)
        return null
    }
}

export default async function IssuePage({
    params,
}: {
    params: Promise<{ number: string }>
}) {
    const { number } = await params
    const issueNumber = parseInt(number, 10)

    // Validate that number is a valid integer
    if (isNaN(issueNumber) || issueNumber <= 0) {
        notFound()
    }

    const issue = await getIssueByNumber(issueNumber)

    // If issue not found or not published, show 404
    if (!issue) {
        notFound()
    }

    const latestNumber = await getLatestIssueNumber()
    const showLatest =
        latestNumber !== undefined && issue.number < latestNumber

    // If no articles, show empty state
    if (issue.articles.length === 0) {
        const issueDate = formatIssueDate(issue.date)
        return (
            <PageLayout clickable={true} date={issueDate} showAbout={true} showLatest={showLatest}>
                <ContentsContainer title={issue.title}>
                    <Empty>No published articles in this issue yet.</Empty>
                </ContentsContainer>
            </PageLayout>
        )
    }

    const issueDate = formatIssueDate(issue.date)

    return (
        <PageLayout clickable={true} date={issueDate} showAbout={true} showLatest={showLatest}>
            <ContentsContainer title={issue.title}>
                <IssueCover
                    cover={
                        <CoverImage
                            src={issue.imageUrl || '/default-issue-cover.png'}
                            alt={`Cover of ${issue.title}`}
                            sizes="(max-width: 700px) 90vw, 600px"
                            fit="contain"
                            priority
                            linkToFullRes
                        />
                    }
                    imageArtist={issue.imageArtist || undefined}
                    articles={issue.articles.map(article => ({
                        id: article.id,
                        title: article.shortTitle || article.title,
                        author: article.author,
                    }))}
                />
                <div className="text contents previewContainer">
                    {issue.articles.map(article => (
                        <ArticlePreview
                            key={article.id}
                            id={article.id}
                            title={article.title}
                            author={article.author}
                            previewText={article.previewText}
                            imageUrl={
                                article.imageUrl ||
                                '/default-article-cover.png'
                            }
                            articleUrl={`/issue/${issue.number}/${article.fileName}`}
                            imageArtist={article.imageArtist || undefined}
                        />
                    ))}
                </div>
            </ContentsContainer>
        </PageLayout>
    )
}
