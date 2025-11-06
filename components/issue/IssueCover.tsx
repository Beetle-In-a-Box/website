'use client'

import Image from 'next/image'
import Link from '@/components/ui/Link'
import Subheader from '@/components/ui/Subheader'
import styles from './IssueCover.module.scss'

interface IssueCoverProps {
    imageSrc: string
    articles: {
        id: string
        title: string
        author: string
    }[]
}

export default function IssueCover({ imageSrc, articles }: IssueCoverProps) {
    const goToElementWithBorder = (elementId: string) => {
        const element = document.getElementById(elementId)
        if (!element) return

        const yOffset = window.innerHeight * 0.22
        const y =
            element.getBoundingClientRect().top + window.pageYOffset - yOffset
        window.scrollTo({ top: y, behavior: 'smooth' })

        element.style.border = '2px dashed black'
        setTimeout(() => {
            element.style.border = 'unset'
        }, 1500)
    }

    return (
        <div className={styles.middle}>
            <Image src={imageSrc} alt="Issue Cover" width={600} height={800} />
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
                            <Link
                                href="/about"
                                target="_blank"
                                variant="default"
                            >
                                {article.author}
                            </Link>
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
