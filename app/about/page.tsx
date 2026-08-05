import PageLayout from '@/components/layout/PageLayout'
import ContentsContainer from '@/components/issue/ContentsContainer'
import Empty from '@/components/ui/Empty'
import { formatIssueDate } from '@/utils/date-utils'
import { getLatestIssueDate } from '@/utils/issue-utils'

// Always fetch fresh data - don't cache this page
export const dynamic = 'force-dynamic'

export default async function About() {
    const latestDate = await getLatestIssueDate()
    const headerDate = latestDate ? formatIssueDate(latestDate) : undefined

    return (
        <PageLayout date={headerDate} showAbout={false} showLatest={true}>
            <ContentsContainer title="ABOUT US">
                <Empty />
            </ContentsContainer>
        </PageLayout>
    )
}
