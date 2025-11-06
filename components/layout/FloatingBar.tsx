'use client'

import Link from '@/components/ui/Link'
import Text from '@/components/ui/Text'
import styles from './FloatingBar.module.scss'

interface FloatingBarProps {
    showAbout?: boolean
    showLatest?: boolean
}

export default function FloatingBar({
    showAbout = true,
    showLatest = false,
}: FloatingBarProps) {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className={styles.floatingBar}>
            <Link onClick={scrollToTop}>Back to Top</Link>
            <Text as="p">|</Text>
            {showAbout && (
                <>
                    <Link href="/about">About Us</Link>
                    <Text as="p">|</Text>
                </>
            )}
            {showLatest && (
                <>
                    <Link href="/">Latest</Link>
                    <Text as="p">|</Text>
                </>
            )}
            <Link>Archive</Link>
        </div>
    )
}
