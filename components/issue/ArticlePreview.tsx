import Link from '@/components/ui/Link'
import styles from './ArticlePreview.module.scss'

interface ArticlePreviewProps {
    id: string
    title: string
    author: string
    previewText: string
    imageUrl: string
    articleUrl: string
}

export default function ArticlePreview({
    id,
    title,
    author,
    previewText,
    imageUrl,
    articleUrl,
}: ArticlePreviewProps) {
    return (
        <div className={styles.articlePreview} id={id}>
            <div
                className={styles.previewPicture}
                style={{ backgroundImage: `url('${imageUrl}')` }}
            />
            <div className={styles.previewTitle}>
                <Link
                    className={styles.previewTitleA}
                    href={articleUrl}
                    target="_blank"
                >
                    {title}
                </Link>
                <Link
                    className={styles.previewAuthor}
                    href="/about"
                    target="_blank"
                    variant="bold"
                >
                    {author}
                </Link>
            </div>
            <div className={styles.previewContent}>
                <p className={styles.previewContentP}>
                    {previewText}{' '}
                    <Link href={articleUrl} target="_blank" variant="text">
                        READ MORE
                    </Link>
                </p>
            </div>
        </div>
    )
}
