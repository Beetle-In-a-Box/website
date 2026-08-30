import PageLayout from '@/components/layout/PageLayout'
import ContentsContainer from '@/components/issue/ContentsContainer'
import Text from '@/components/ui/Text'
import Link from '@/components/ui/Link'
import { formatIssueDate } from '@/utils/date-utils'
import { getLatestIssueDate } from '@/utils/issue-utils'
import styles from './page.module.scss'

// Always fetch fresh data - don't cache this page
export const dynamic = 'force-dynamic'

export default async function ConnectPage() {
    const latestDate = await getLatestIssueDate()
    const headerDate = latestDate ? formatIssueDate(latestDate) : undefined

    return (
        <PageLayout date={headerDate} showAbout={true}>
            <ContentsContainer title="Connect">
                <div className={styles.connectList}>
                    <Text as="p">
                        Email:{' '}
                        <Link href="mailto:beetleinabox@gmail.com">
                            beetleinabox@gmail.com
                        </Link>
                    </Text>
                    <Text as="p">
                        Instagram:{' '}
                        <Link
                            href="https://www.instagram.com/beetleinaboxcal"
                            target="_blank"
                        >
                            @beetleinaboxcal
                        </Link>
                    </Text>
                    <Text as="p">
                        If you are interested in receiving print editions of
                        the magazine, please fill out this form.
                    </Text>
                    <Text as="p">
                        If you would like to join us, please{' '}
                        <Link
                            href="https://tinyurl.com/beetle2026fall"
                            target="_blank"
                        >
                            apply here
                        </Link>
                        .
                    </Text>
                </div>
            </ContentsContainer>
        </PageLayout>
    )
}
