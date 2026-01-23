import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import FloatingBar from '@/components/layout/FloatingBar'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'
import Empty from '@/components/ui/Empty'
import { prisma } from '@/utils/prisma'
import { formatIssueDate } from '@/utils/date-utils'

// Always fetch fresh data - don't cache this page
export const dynamic = 'force-dynamic'

async function getLatestIssueDate() {
    try {
        const latestIssue = await prisma.issue.findFirst({
            where: { published: true },
            orderBy: { number: 'desc' },
            select: { date: true },
        })
        return latestIssue?.date || undefined
    } catch (error) {
        console.error('Error fetching latest issue:', error)
        return undefined
    }
}

export default async function About() {
    const latestDate = await getLatestIssueDate()
    const headerDate = latestDate ? formatIssueDate(latestDate) : undefined

    return (
        <MainContainer>
            <NavBar date={headerDate} />
            <ContentsContainer title="ABOUT US">
                <Empty />
            </ContentsContainer>
            <FloatingBar showAbout={false} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
