import { notFound } from 'next/navigation'
import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'
import IssueCover from '@/components/issue/IssueCover'
import ArticlePreview from '@/components/issue/ArticlePreview'
import { prisma } from '@/utils/prisma'

interface IssuePageProps {
    params: Promise<{
        number: string
    }>
}

async function getIssue(issueNumber: number) {
    try {
        const issue = await prisma.issue.findUnique({
            where: { number: issueNumber },
            include: {
                articles: {
                    where: { published: true },
                    orderBy: { number: 'asc' },
                },
            },
        })
        return issue
    } catch (error) {
        console.error('Error fetching issue:', error)
        return null
    }
}

export async function generateStaticParams() {
    try {
        const issues = await prisma.issue.findMany({
            where: { published: true },
            select: { number: true },
        })

        return issues.map(issue => ({
            number: issue.number.toString(),
        }))
    } catch (error) {
        console.error('Error generating static params:', error)
        return []
    }
}

export default async function IssuePage({ params }: IssuePageProps) {
    const resolvedParams = await params
    const issueNumber = parseInt(resolvedParams.number, 10)

    if (isNaN(issueNumber)) {
        notFound()
    }

    const issue = await getIssue(issueNumber)

    if (!issue || !issue.published) {
        notFound()
    }

    return (
        <MainContainer>
            <NavBar date={issue.date} />
            <ContentsContainer title={issue.title}>
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
                                article.imageUrl || '/default-article-cover.png'
                            }
                            articleUrl={`/issue-${issue.number}/${article.fileName}`}
                        />
                    ))}
                </div>
            </ContentsContainer>
            <FloatingBar showAbout={true} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
