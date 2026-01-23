import Link from '@/components/ui/Link'
import { formatIssueDate } from '@/utils/date-utils'
import styles from './IssueListItem.module.scss'

interface IssueListItemProps {
    number: number
    title: string
    date: Date | string
    imageUrl: string
    articleCount: number
    pdfUrl?: string
}

export default function IssueListItem({
    number,
    title,
    date,
    imageUrl,
    articleCount,
    pdfUrl,
}: IssueListItemProps) {
    return (
        <div className={styles.issueListItem}>
            <Link href={`/issue/${number}`} className={styles.thumbnailLink}>
                <div
                    className={styles.thumbnail}
                    style={{ backgroundImage: `url('${imageUrl}')` }}
                />
            </Link>
            <div className={styles.metadata}>
                <div className={styles.issueNumber}>Issue {number}</div>
                <div className={styles.issueTitle}>{title}</div>
                <div className={styles.issueDetails}>
                    <span className={styles.date}>{formatIssueDate(date)}</span>
                    <span className={styles.separator}>•</span>
                    <span className={styles.articleCount}>
                        {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                    </span>
                </div>
                <div className={styles.actions}>
                    <Link href={`/issue/${number}`} className={styles.button}>
                        Visit
                    </Link>
                    {pdfUrl && (
                        <a href={pdfUrl} download className={styles.button}>
                            Download PDF
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
