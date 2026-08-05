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
                // Must track ArticlePreview.module.scss, or the browser picks a
                // variant sized for a slot that no longer exists. The old value
                // ("(max-width: 700px) 40vw, 300px") described the pre-responsive
                // layout: a 700px breakpoint that is now 768, a 40vw column that
                // is now the full stacked width, and a flat 300px desktop column
                // that is now fluid. It made the browser request an 800px bitmap
                // for what is really a 353px slot at DPR 3 -- soft artwork on a
                // modern phone, on a site whose whole point is the artwork.
                //   <=768  stacked, image spans the content width (~90vw)
                //   <=1100 minmax(240px, 28vw), so the floor dominates near 768
                //   >1100  0.5fr of the grid, measured ~27vw at 1280 and 1440
                sizes="(max-width: 768px) 92vw, (max-width: 1100px) 32vw, 28vw"
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
