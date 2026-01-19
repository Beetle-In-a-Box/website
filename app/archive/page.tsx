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

async function getArchivedIssues() {
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
        // Return all issues except the first one (newest)
        return issues.slice(1)
    } catch (error) {
        console.error('Error fetching archived issues:', error)
        return []
    }
}

export default async function Archive() {
    const archivedIssues = await getArchivedIssues()

    // If no archived issues, show a message
    if (archivedIssues.length === 0) {
        return (
            <MainContainer>
                <NavBar clickable={true} />
                <ContentsContainer>
                    <Empty>No archived issues available yet. Check back soon!</Empty>
                </ContentsContainer>
                <FloatingBar showAbout={true} showLatest={true} />
                <Footer />
            </MainContainer>
        )
    }

    return (
        <MainContainer>
            <NavBar clickable={true} />
            {archivedIssues.map(issue => (
                <ContentsContainer key={issue.id} title={issue.title}>
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
            ))}
            <FloatingBar showAbout={true} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
