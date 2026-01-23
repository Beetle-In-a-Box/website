import { notFound } from 'next/navigation'
import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'
import IssueCover from '@/components/issue/IssueCover'
import ArticlePreview from '@/components/issue/ArticlePreview'
import Empty from '@/components/ui/Empty'
import { prisma } from '@/utils/prisma'
import { formatIssueDate } from '@/utils/date-utils'

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
    params: { number: string }
}) {
    const issueNumber = parseInt(params.number, 10)

    // Validate that number is a valid integer
    if (isNaN(issueNumber) || issueNumber <= 0) {
        notFound()
    }

    const issue = await getIssueByNumber(issueNumber)

    // If issue not found or not published, show 404
    if (!issue) {
        notFound()
    }

    // If no articles, show empty state
    if (issue.articles.length === 0) {
        const issueDate = formatIssueDate(issue.date)
        return (
            <MainContainer>
                <NavBar clickable={true} date={issueDate} />
                <ContentsContainer title={issue.title}>
                    <Empty>No published articles in this issue yet.</Empty>
                </ContentsContainer>
                <FloatingBar showAbout={true} showLatest={true} />
                <Footer />
            </MainContainer>
        )
    }

    const issueDate = formatIssueDate(issue.date)

    return (
        <MainContainer>
            <NavBar clickable={true} date={issueDate} />
            <ContentsContainer title={issue.title}>
                {issue.pdfUrl && (
                    <div style={{ marginBottom: '2rem' }}>
                        <a
                            href={issue.pdfUrl}
                            download
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                fontFamily: "'Lora', serif",
                                fontSize: '1rem',
                                fontWeight: 500,
                                color: '#1a1a1a',
                                backgroundColor: 'transparent',
                                border: '1px solid #1a1a1a',
                                borderRadius: '2px',
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = '#1a1a1a'
                                e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = '#1a1a1a'
                            }}
                        >
                            Download PDF
                        </a>
                    </div>
                )}
                <IssueCover
                    imageSrc={issue.imageUrl || '/default-issue-cover.png'}
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
            <FloatingBar showAbout={true} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
