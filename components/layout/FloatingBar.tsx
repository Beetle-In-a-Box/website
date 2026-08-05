'use client'

import Link from '@/components/ui/Link'
import Text from '@/components/ui/Text'
import styles from './FloatingBar.module.scss'

interface FloatingBarProps {
    showAbout?: boolean
    showLatest?: boolean
}

/**
 * Always visible, at every width.
 *
 * This used to slide away on scroll-down below 768px and return on scroll-up.
 * That was removed 2026-08-05 at the user's request -- "the pill should always
 * show on mobile, never hide" -- taking the scroll listener, the `hidden`
 * state and the `.hidden` class with it. Do not reintroduce them without
 * asking; it was an explicit decision, not an oversight.
 *
 * Still a client component only because `Back to Top` needs window.scrollTo.
 */
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
            <Link href="/archive">Archive</Link>
            <Text as="p">|</Text>
            <Link href="/apply">Apply</Link>
        </div>
    )
}
