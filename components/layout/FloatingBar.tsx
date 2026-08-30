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
 * show on mobile, never hide" -- do not reintroduce it without asking.
 *
 * "Back to Top" was removed 2026-08-29 at the user's request, which also made
 * this a server component. "Latest" only renders on past-issue pages -- on the
 * current issue it pointed at the page already on screen.
 */
export default function FloatingBar({
    showAbout = true,
    showLatest = false,
}: FloatingBarProps) {
    return (
        <div className={styles.floatingBar}>
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
            <Link href="/connect">Connect</Link>
        </div>
    )
}
