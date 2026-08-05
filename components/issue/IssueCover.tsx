'use client'

import type { ReactNode } from 'react'
import Subheader from '@/components/ui/Subheader'
import { scrollToElementWithOffset } from '@/utils/scroll-utils'
import styles from './IssueCover.module.scss'

interface IssueCoverProps {
    /**
     * The rendered cover art. Passed in as an element because this is a client
     * component and the blur placeholder has to be resolved on the server.
     */
    cover: ReactNode
    imageArtist?: string
    articles: {
        id: string
        title: string
        author: string | { name: string; slug: string } | null
    }[]
}

export default function IssueCover({ cover, imageArtist, articles }: IssueCoverProps) {
    const goToElementWithBorder = (elementId: string) => {
        const element = document.getElementById(elementId)
        if (!element) return

        scrollToElementWithOffset(element)

        element.style.border = '2px dashed black'
        setTimeout(() => {
            element.style.border = 'unset'
        }, 1500)
    }

    return (
        <div className={styles.middle}>
            <div>
                {cover}
                {imageArtist && (
                    <div style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
                        Art by {imageArtist}
                    </div>
                )}
            </div>
            <div className={`${styles.slideFadeIn}`}>
                <ol>
                    {articles.map((article, index) => (
                        <li key={article.id}>
                            <Subheader
                                onClick={() =>
                                    goToElementWithBorder(article.id)
                                }
                            >
                                {article.title}
                            </Subheader>
                            <br />
                            <span
                                onClick={() =>
                                    goToElementWithBorder(article.id)
                                }
                                className={styles.clickableAuthor}
                            >
                                {typeof article.author === 'string'
                                    ? article.author
                                    : article.author?.name || 'Unknown'}
                            </span>
                            {index < articles.length - 1 && (
                                <>
                                    <br />
                                    <br />
                                </>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    )
}
