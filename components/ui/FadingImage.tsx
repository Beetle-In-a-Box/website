'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './CoverImage.module.scss'

interface FadingImageProps {
    src: string
    srcSet?: string
    sizes?: string
    alt: string
    loading: 'lazy' | 'eager'
    fit: 'cover' | 'contain'
}

/**
 * The <img> half of CoverImage, split out because it needs a load handler and
 * therefore has to be a client component.
 *
 * Starts transparent so the blurred placeholder underneath shows through, then
 * fades in once the real bytes have decoded.
 */
export default function FadingImage({
    src,
    srcSet,
    sizes,
    alt,
    loading,
    fit,
}: FadingImageProps) {
    const [loaded, setLoaded] = useState(false)
    const ref = useRef<HTMLImageElement>(null)

    // A cached image can finish loading before React hydrates, in which case the
    // onLoad event never fires and the image would stay invisible forever. Check
    // the flag the browser sets on the element itself.
    useEffect(() => {
        if (ref.current?.complete) setLoaded(true)
    }, [])

    return (
        <img
            ref={ref}
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading={loading}
            decoding="async"
            onLoad={() => setLoaded(true)}
            // If the image fails, reveal it anyway so the alt text is readable
            // instead of sitting invisible over a blur.
            onError={() => setLoaded(true)}
            className={`${styles.image} ${loaded ? styles.loaded : ''}`}
            style={{ objectFit: fit }}
        />
    )
}
