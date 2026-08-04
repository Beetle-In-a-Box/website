'use client'

import { useEffect } from 'react'
import { scrollToElementWithOffset } from '@/utils/scroll-utils'

/**
 * Client component that handles footnote click interactions
 * Scrolls to and highlights footnotes when clicked
 */
export default function FootnoteHandler() {
    useEffect(() => {
        function goToElementWithHighlight(elementID: string) {
            const element = document.getElementById(elementID)
            if (!element) return

            scrollToElementWithOffset(element)

            // Highlight the element
            element.style.backgroundColor = 'yellow'
            element.style.fontSize = 'x-large'

            // Remove highlight after 3 seconds
            setTimeout(() => {
                element.style.backgroundColor = 'unset'
                element.style.fontSize = 'unset'
            }, 3000)
        }

        function handleFootnoteClick(event: Event) {
            const target = event.currentTarget as HTMLElement
            const footnoteTarget = target.getAttribute('data-footnote-target')
            if (footnoteTarget) {
                event.preventDefault()
                goToElementWithHighlight(footnoteTarget)
            }
        }

        // Attach event listeners to all elements with data-footnote-target
        const footnoteElements = document.querySelectorAll('[data-footnote-target]')
        footnoteElements.forEach(element => {
            element.addEventListener('click', handleFootnoteClick)
        })

        // Cleanup event listeners on unmount
        return () => {
            footnoteElements.forEach(element => {
                element.removeEventListener('click', handleFootnoteClick)
            })
        }
    }, [])

    return null // This component doesn't render anything
}
