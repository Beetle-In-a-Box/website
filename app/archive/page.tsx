import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'
import MainContainer from '@/components/layout/MainContainer'
import IssueListContainer from '@/components/issue/IssueListContainer'
import IssueListItem from '@/components/issue/IssueListItem'
import Empty from '@/components/ui/Empty'
import { prisma } from '@/utils/prisma'
import { formatIssueDate } from '@/utils/date-utils'

// Always fetch fresh data - don't cache this page
export const dynamic = 'force-dynamic'

async function getPublishedIssuesWithCounts() {
    try {
        const issues = await prisma.issue.findMany({
            where: { published: true },
            include: {
                _count: {
                    select: {
                        articles: {
                            where: { published: true },
                        },
                    },
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

export default async function Archive() {
    const allIssues = await getPublishedIssuesWithCounts()
    const archivedIssues = allIssues.slice(1) // Exclude the latest issue

    // Get the latest issue's date for the header
    const latestIssue = allIssues[0]
    const issueDate = latestIssue ? formatIssueDate(latestIssue.date) : undefined

    // If no archived issues, show a message
    if (archivedIssues.length === 0) {
        return (
            <MainContainer>
                <NavBar clickable={true} date={issueDate} />
                <IssueListContainer>
                    <Empty>No archived issues available yet. Check back soon!</Empty>
                </IssueListContainer>
                <FloatingBar showAbout={true} showLatest={true} />
                <Footer />
            </MainContainer>
        )
    }

    return (
        <MainContainer>
            <NavBar clickable={true} date={issueDate} />
            <IssueListContainer title="Past Issues">
                {archivedIssues.map(issue => (
                    <IssueListItem
                        key={issue.id}
                        number={issue.number}
                        title={issue.title}
                        date={issue.date}
                        imageUrl={issue.imageUrl || '/default-issue-cover.png'}
                        articleCount={issue._count.articles}
                        pdfUrl={issue.pdfUrl || undefined}
                    />
                ))}
            </IssueListContainer>
            <FloatingBar showAbout={true} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
