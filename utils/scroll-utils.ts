/**
 * Scrolls smoothly to an element, offsetting the target position so the
 * element lands lower in the viewport (22vh from the top) rather than
 * flush against it.
 */
export function scrollToElementWithOffset(element: HTMLElement) {
    const yOffset = window.innerHeight * 0.22
    const y = element.getBoundingClientRect().top + window.pageYOffset - yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
}
