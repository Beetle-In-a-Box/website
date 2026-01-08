'use client'

import { useEffect } from 'react'

/**
 * Client component that handles footnote click interactions
 * Scrolls to and highlights footnotes when clicked
 */
export default function FootnoteHandler() {
    useEffect(() => {
        function goToElementWithHighlight(elementID: string) {
            const element = document.getElementById(elementID)
            if (!element) return

            const yOffset = window.innerHeight * 0.22 // 22vh offset
            const y = element.getBoundingClientRect().top + window.pageYOffset - yOffset
            window.scrollTo({ top: y, behavior: 'smooth' })

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
