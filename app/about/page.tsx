import PageLayout from '@/components/layout/PageLayout'
import ContentsContainer from '@/components/issue/ContentsContainer'
import Text from '@/components/ui/Text'
import { formatIssueDate } from '@/utils/date-utils'
import { getLatestIssueDate } from '@/utils/issue-utils'
import styles from './page.module.scss'

// Always fetch fresh data - don't cache this page
export const dynamic = 'force-dynamic'

const editors = [
    { name: 'Max Abubucker' },
    { name: 'Deniz Durusoy', role: 'President of the Editorial Board' },
    { name: 'Nicole Kadi', role: 'President of Administration' },
    { name: 'Sichen Li', role: 'President of Design' },
    { name: 'Lachlan Lewis' },
    { name: 'Jacob Molina' },
    { name: 'Karis Morasch' },
    { name: 'James Pagett Tollen' },
    { name: 'Cole Poder' },
]

export default async function About() {
    const latestDate = await getLatestIssueDate()
    const headerDate = latestDate ? formatIssueDate(latestDate) : undefined

    return (
        <PageLayout date={headerDate} showAbout={false}>
            <ContentsContainer title="ABOUT US">
                <div className={styles.aboutColumns}>
                    <div className={styles.column}>
                        <Text as="p">
                            Beetle in a Box is a philosophy magazine produced
                            by students at the University of California,
                            Berkeley. We were founded in 2025 and publish an
                            issue semesterly.
                        </Text>
                        <div className={styles.sectionHeading}>
                            Editorial Board
                        </div>
                        <ul className={styles.editorList}>
                            {editors.map(editor => (
                                <li key={editor.name}>
                                    <Text as="span">{editor.name}</Text>
                                    {editor.role && (
                                        <Text
                                            as="span"
                                            className={styles.editorRole}
                                        >
                                            {' '}
                                            — {editor.role}
                                        </Text>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={styles.column}>
                        <div className={styles.sectionHeading}>
                            On the name Beetle in a Box
                        </div>
                        <Text as="p">
                            In the iconic <i>Philosophical Investigations</i>,
                            Ludwig Wittgenstein posits that we can have
                            meaningful conversations about certain things even
                            if our mental or sensational conceptualization of
                            them differs. The thought experiment goes as
                            follows: imagine a group of people, each one with a
                            box. Inside each box is something everyone calls a
                            &ldquo;beetle.&rdquo; While each person can look
                            into their own box, no one is allowed to look into
                            anyone else&rsquo;s. Yet they all chatter
                            meaningfully about beetles&mdash;beetles are gross!
                            Beetles are fussy! Beetles are small! Whether each
                            person&rsquo;s box contains the same thing seems
                            irrelevant. Meaning comes ultimately from the way
                            we use language.
                        </Text>
                        <Text as="p">
                            At Beetle in a Box, we hope to prevail in the same
                            way despite potential internal differences, to make
                            our most unique ideas communal. Hopefully, whatever
                            discrepancy there may be in our beetles will only
                            cause more coalescing thoughts and out-of-the-box
                            reasoning.
                        </Text>
                    </div>
                </div>
            </ContentsContainer>
        </PageLayout>
    )
}
