'use client'

import { useEffect, useRef, useState } from 'react'
import Link from '@/components/ui/Link'
import Text from '@/components/ui/Text'
import styles from './FloatingBar.module.scss'

interface FloatingBarProps {
    showAbout?: boolean
    showLatest?: boolean
}

/** Scroll distance below which the bar always stays put. */
const REVEAL_ZONE = 80

/** Ignore jitter and rubber-band overscroll smaller than this. */
const DELTA_THRESHOLD = 6

export default function FloatingBar({
    showAbout = true,
    showLatest = false,
}: FloatingBarProps) {
    // Starts visible, so the server-rendered markup carries no hidden state and
    // a browser that never runs this JS gets exactly today's always-on bar.
    // The bar hiding must never be something only JavaScript can undo.
    const [hidden, setHidden] = useState(false)
    const lastY = useRef(0)
    const ticking = useRef(false)

    useEffect(() => {
        lastY.current = window.scrollY

        const onScroll = () => {
            // Coalesce to one measurement per frame; scroll fires far more
            // often than the layout can meaningfully change.
            if (ticking.current) return
            ticking.current = true

            requestAnimationFrame(() => {
                const y = window.scrollY
                const delta = y - lastY.current

                if (y <= REVEAL_ZONE) {
                    setHidden(false)
                } else if (Math.abs(delta) > DELTA_THRESHOLD) {
                    // Reading moves the page up, so hide on scroll down and
                    // bring it back the moment the reader reverses.
                    setHidden(delta > 0)
                }

                lastY.current = y
                ticking.current = false
            })
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div
            className={`${styles.floatingBar} ${hidden ? styles.hidden : ''}`}
        >
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
