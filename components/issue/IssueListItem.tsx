import Link from '@/components/ui/Link'
import styles from './IssueListItem.module.scss'

interface IssueListItemProps {
    number: number
    title: string
    date: string
    imageUrl: string
    articleCount: number
}

export default function IssueListItem({
    number,
    title,
    date,
    imageUrl,
    articleCount,
}: IssueListItemProps) {
    return (
        <Link href={`/issue/${number}`} className={styles.issueListItem}>
            <div
                className={styles.thumbnail}
                style={{ backgroundImage: `url('${imageUrl}')` }}
            />
            <div className={styles.metadata}>
                <div className={styles.issueNumber}>Issue {number}</div>
                <div className={styles.issueTitle}>{title}</div>
                <div className={styles.issueDetails}>
                    <span className={styles.date}>{date}</span>
                    <span className={styles.separator}>•</span>
                    <span className={styles.articleCount}>
                        {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                    </span>
                </div>
            </div>
        </Link>
    )
}
