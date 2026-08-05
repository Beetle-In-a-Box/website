import { getBlurDataUrl, VARIANT_WIDTHS } from '@/utils/image-variants'
import FadingImage from './FadingImage'
import styles from './CoverImage.module.scss'

interface CoverImageProps {
    /** Public path, e.g. '/images/article-5-1769583948962.png'. */
    src: string
    alt: string
    /** CSS sizes attribute, so the browser can pick the right srcset entry. */
    sizes: string
    /** How the image fills its box. Defaults to 'contain'. */
    fit?: 'cover' | 'contain'
    /** Applied to the outermost element, for grid placement by the caller. */
    className?: string
    /** Load eagerly instead of lazily. Use for above-the-fold art. */
    priority?: boolean
    /** Wrap in a link to the untouched original, opened in a new tab. */
    linkToFullRes?: boolean
}

/** Uploaded images live under /images/ and are the only ones with derivatives. */
const UPLOAD_PREFIX = '/images/'

/**
 * Cover art with a blur-up placeholder and responsive compressed sources.
 *
 * Deliberately does not use next/image: the platform image optimizer is a
 * passthrough on the production host (it returns originals unchanged), so this
 * renders a plain <img> against derivatives produced by utils/image-variants.
 *
 * Images served from public/ rather than uploads/ have no derivatives, so they
 * render as an ordinary <img> with no srcset and no placeholder.
 */
export default async function CoverImage({
    src,
    alt,
    sizes,
    fit = 'contain',
    className,
    priority = false,
    linkToFullRes = false,
}: CoverImageProps) {
    const isUpload = src.startsWith(UPLOAD_PREFIX)
    const filename = isUpload ? src.slice(UPLOAD_PREFIX.length) : null
    const blurDataUrl = filename ? await getBlurDataUrl(filename) : null

    const srcSet = isUpload
        ? VARIANT_WIDTHS.map(width => `${src}?w=${width} ${width}w`).join(', ')
        : undefined

    // Middle width as the src: what a browser without srcset support gets, and
    // what the tests assert against.
    const displaySrc = isUpload ? `${src}?w=800` : src

    const fitClass = fit === 'cover' ? styles.wrapperCover : styles.wrapperContain
    const wrapperClass = `${styles.wrapper} ${fitClass}`

    const picture = (
        <span
            data-cover-wrapper=""
            className={linkToFullRes ? wrapperClass : `${wrapperClass} ${className ?? ''}`}
            style={
                blurDataUrl
                    ? { backgroundImage: `url('${blurDataUrl}')` }
                    : undefined
            }
        >
            <FadingImage
                src={displaySrc}
                srcSet={srcSet}
                sizes={isUpload ? sizes : undefined}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                fit={fit}
            />
        </span>
    )

    if (!linkToFullRes) return picture

    return (
        <a
            // No ?w= - the bare URL is the untouched full-resolution original.
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            aria-label={`${alt} - open full resolution in a new tab`}
        >
            {picture}
        </a>
    )
}
