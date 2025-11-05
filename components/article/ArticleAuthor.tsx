import Link from 'next/link'
import styles from './ArticleAuthor.module.scss'

interface ArticleAuthorProps {
    author: string
    role?: string
}

export default function ArticleAuthor({
    author,
    role = 'Staff Writer',
}: ArticleAuthorProps) {
    return (
        <div className={`${styles.authorAttr} ${styles.text}`}>
            By{' '}
            <Link className={styles.bold} href="/about" target="_blank">
                {author}
            </Link>{' '}
            | {role}
        </div>
    )
}
