import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'
import IssueCover from '@/components/issue/IssueCover'
import ArticlePreview from '@/components/issue/ArticlePreview'
import Empty from '@/components/ui/Empty'
import { prisma } from '@/utils/prisma'

// Always fetch fresh data - don't cache this page
export const dynamic = 'force-dynamic'

async function getPublishedIssues() {
    try {
        const issues = await prisma.issue.findMany({
            where: { published: true },
            include: {
                articles: {
                    where: { published: true },
                    orderBy: { number: 'asc' },
                },
            },
            orderBy: { number: 'desc' },
        })
        return issues
    } catch (error) {
        console.error('Error fetching issues:', error)
        return []
    }
}

export default async function Home() {
    const issues = await getPublishedIssues()

    // If no issues, show a message
    if (issues.length === 0) {
        return (
            <MainContainer>
                <NavBar clickable={false} />
                <ContentsContainer>
                    <Empty>No published issues available yet. Check back soon!</Empty>
                </ContentsContainer>
                <FloatingBar showAbout={true} showLatest={false} />
                <Footer />
            </MainContainer>
        )
    }

    // Get the latest issue (first one after sorting by number desc)
    const latestIssue = issues[0]

    return (
        <MainContainer>
            <NavBar clickable={false} />
            <ContentsContainer title={latestIssue.title}>
                <IssueCover
                    imageSrc={latestIssue.imageUrl || '/default-issue-cover.png'}
                    articles={latestIssue.articles.map(article => ({
                        id: article.id,
                        title: article.shortTitle || article.title,
                        author: article.author,
                    }))}
                />
                <div className="text contents previewContainer">
                    {latestIssue.articles.map(article => (
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
                            articleUrl={`/issue/${latestIssue.number}/${article.fileName}`}
                            imageArtist={article.imageArtist || undefined}
                        />
                    ))}
                </div>
            </ContentsContainer>
            <FloatingBar showAbout={true} showLatest={false} />
            <Footer />
        </MainContainer>
    )
}
