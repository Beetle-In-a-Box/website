import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'
import IssueCover from '@/components/issue/IssueCover'
import ArticlePreview from '@/components/issue/ArticlePreview'
import { prisma } from '@/utils/prisma'

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
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>
                            No published issues available yet. Check back soon!
                        </p>
                    </div>
                </ContentsContainer>
                <FloatingBar showAbout={true} showLatest={false} />
                <Footer />
            </MainContainer>
        )
    }

    return (
        <MainContainer>
            <NavBar clickable={false} date={issues[0]?.date || 'AUGUST 2025'} />
            {issues.map(issue => (
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
                                articleUrl={`/issue-${issue.number}/${article.fileName}`}
                            />
                        ))}
                    </div>
                </ContentsContainer>
            ))}
            <FloatingBar showAbout={true} showLatest={false} />
            <Footer />
        </MainContainer>
    )
}
