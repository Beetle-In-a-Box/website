import Link from '@/components/ui/Link'
import AuthorLink from '@/components/ui/AuthorLink'
import CoverImage from '@/components/ui/CoverImage'
import { truncateText } from '@/utils/text-utils'
import styles from './ArticlePreview.module.scss'

interface ArticlePreviewProps {
    id: string
    title: string
    author: {
        name: string
        slug: string
    } | string | null
    previewText: string
    imageUrl: string
    articleUrl: string
    imageArtist?: string
}

export default function ArticlePreview({
    id,
    title,
    author,
    previewText,
    imageUrl,
    articleUrl,
    imageArtist,
}: ArticlePreviewProps) {
    const truncatedPreview = truncateText(previewText, 300)

    return (
        <div className={styles.articlePreview} id={id}>
            <CoverImage
                src={imageUrl}
                alt={title}
                className={styles.previewPicture}
                fit="contain"
                sizes="(max-width: 700px) 40vw, 300px"
                linkToFullRes
            />
            {imageArtist && (
                <div className={styles.imageArtist}>Art by {imageArtist}</div>
            )}
            <div className={styles.previewTitle}>
                <Link
                    className={styles.previewTitleA}
                    href={articleUrl}
                    target="_blank"
                >
                    {title}
                </Link>
                {author && (
                    typeof author === 'string' ? (
                        <Link
                            className={styles.previewAuthor}
                            href="/about"
                            target="_blank"
                            variant="bold"
                        >
                            {author}
                        </Link>
                    ) : (
                        <AuthorLink
                            name={author.name}
                            slug={author.slug}
                            className={styles.previewAuthor}
                        />
                    )
                )}
            </div>
            <div className={styles.previewContent}>
                <p className={styles.previewContentP}>
                    {truncatedPreview}{' '}
                    <Link href={articleUrl} target="_blank" variant="text">
                        READ MORE
                    </Link>
                </p>
            </div>
        </div>
    )
}
