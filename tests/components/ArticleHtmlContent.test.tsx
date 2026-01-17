import { describe, it, expect, mock } from 'bun:test'
import { render } from '@testing-library/react'
import React from 'react'

// Mock Next.js Image component
mock.module('next/image', () => ({
    default: function Image(props: React.ImgHTMLAttributes<HTMLImageElement>) {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />
    },
}))

import ArticleHtmlContent from '@/components/article/ArticleHtmlContent'

/**
 * Tests for ArticleHtmlContent component
 * Ensures HTML is safely converted to React with proper handling of:
 * - Images (converted to Next.js Image)
 * - Links (target="_blank" added)
 * - Footnotes (data attributes preserved)
 */

describe('ArticleHtmlContent', () => {
    describe('Image Conversion', () => {
        it('should convert <img> tags to Next.js Image components', () => {
            const html = `
                <p>Here is an image:</p>
                <img src="/images/test.jpg" alt="Test Image" width="800" height="600" />
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            // Should have an img element (Next.js Image renders as img)
            const img = container.querySelector('img')
            expect(img).toBeTruthy()
            expect(img?.getAttribute('src')).toContain('test.jpg')
            expect(img?.getAttribute('alt')).toBe('Test Image')
        })

        it('should handle images without width/height attributes', () => {
            const html = `<img src="/images/test.jpg" alt="Test" />`

            const { container } = render(<ArticleHtmlContent html={html} />)

            const img = container.querySelector('img')
            expect(img).toBeTruthy()
        })

        it('should preserve image alt text', () => {
            const html = `<img src="/test.jpg" alt="Meaningful description" />`

            const { container } = render(<ArticleHtmlContent html={html} />)

            const img = container.querySelector('img')
            expect(img?.getAttribute('alt')).toBe('Meaningful description')
        })
    })

    describe('Link Handling', () => {
        it('should add target="_blank" to all links', () => {
            const html = `
                <p>Check out <a href="https://example.com">this link</a></p>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const link = container.querySelector('a')
            expect(link).toBeTruthy()
            expect(link?.getAttribute('target')).toBe('_blank')
            expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
        })

        it('should preserve link href and text content', () => {
            const html = `
                <a href="https://iep.utm.edu/experience-machine/">Experience Machine</a>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const link = container.querySelector('a')
            expect(link?.getAttribute('href')).toBe(
                'https://iep.utm.edu/experience-machine/'
            )
            expect(link?.textContent).toBe('Experience Machine')
        })

        it('should handle multiple links in the same content', () => {
            const html = `
                <p>
                    Visit <a href="https://example1.com">link 1</a> and
                    <a href="https://example2.com">link 2</a>
                </p>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const links = container.querySelectorAll('a')
            expect(links.length).toBe(2)
            links.forEach(link => {
                expect(link.getAttribute('target')).toBe('_blank')
                expect(link.getAttribute('rel')).toBe('noopener noreferrer')
            })
        })

        it('should preserve link class names', () => {
            const html = `
                <a href="https://example.com" class="bold authorAttrName">Author Name</a>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const link = container.querySelector('a')
            expect(link?.className).toContain('bold')
            expect(link?.className).toContain('authorAttrName')
        })
    })

    describe('Footnote Handling', () => {
        it('should preserve onclick attributes as data-footnote-target', () => {
            const html = `
                <p>
                    Some text with a footnote
                    <sup class='footnoteLink' id='fl1' onclick="goToElementWithHighlightModern('f1')">1</sup>
                </p>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const sup = container.querySelector('sup')
            expect(sup).toBeTruthy()
            expect(sup?.getAttribute('data-footnote-target')).toBe('f1')
            expect(sup?.getAttribute('id')).toBe('fl1')
            expect(sup?.className).toContain('footnoteLink')
        })

        it('should add cursor pointer style to footnotes', () => {
            const html = `
                <sup class='footnoteLink' id='fl1' onclick="goToElementWithHighlightModern('f1')">1</sup>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const sup = container.querySelector('sup')
            expect(sup).toBeTruthy()
            // Check for cursor: pointer style
            const style = sup?.getAttribute('style')
            expect(style).toContain('cursor')
            expect(style).toContain('pointer')
        })

        it('should handle multiple footnotes in the same content', () => {
            const html = `
                <p>
                    First footnote<sup class='footnoteLink' id='fl1' onclick="goToElementWithHighlightModern('f1')">1</sup>
                    and second<sup class='footnoteLink' id='fl2' onclick="goToElementWithHighlightModern('f2')">2</sup>
                </p>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const footnotes = container.querySelectorAll('sup')
            expect(footnotes.length).toBe(2)
            expect(footnotes[0]?.getAttribute('data-footnote-target')).toBe('f1')
            expect(footnotes[1]?.getAttribute('data-footnote-target')).toBe('f2')
        })

        it('should handle citation footnotes with onclick', () => {
            const html = `
                <p class='text footnote' id='f1' onclick="goToElementWithHighlightModern('fl1')">
                    <sup>1</sup> Citation text here
                </p>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const paragraph = container.querySelector('p')
            expect(paragraph).toBeTruthy()
            expect(paragraph?.getAttribute('data-footnote-target')).toBe('fl1')
            expect(paragraph?.getAttribute('id')).toBe('f1')
        })
    })

    describe('Complex HTML Conversion', () => {
        it('should handle realistic article content with mixed elements', () => {
            const html = `
                <p>
                    In Anarchy, State, and Utopia (1974), Nozick introduces this thought experiment.
                    <sup class='footnoteLink' id='fl1' onclick="goToElementWithHighlightModern('f1')">1</sup>
                    For more information, see <a href="https://iep.utm.edu/experience-machine/">this article</a>.
                </p>
                <img src="/images/article.jpg" alt="Article illustration" width="800" height="600" />
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            // Should have paragraph
            const paragraph = container.querySelector('p')
            expect(paragraph).toBeTruthy()

            // Should have footnote with data attribute
            const footnote = container.querySelector('sup')
            expect(footnote?.getAttribute('data-footnote-target')).toBe('f1')

            // Should have link with target="_blank"
            const link = container.querySelector('a')
            expect(link?.getAttribute('target')).toBe('_blank')

            // Should have image
            const img = container.querySelector('img')
            expect(img).toBeTruthy()
        })

        it('should handle Issue 1 article structure', () => {
            // Simulated structure from convenience-illusion.html
            const html = `
                <p>
                    Robert Nozick's experience machine offers a chance to live your greatest life.
                    <sup class='footnoteLink' id='fl1' onclick="goToElementWithHighlightModern('f1')">1</sup>
                </p>
                <p>
                    However, Nozick argues that many would not opt into the experience machine.
                    <sup class='footnoteLink' id='fl2' onclick="goToElementWithHighlightModern('f2')">2</sup>
                </p>
                <div class='footnoteBorder'></div>
                <p class='text footnote' id='f1' onclick="goToElementWithHighlightModern('fl1')">
                    <sup>1</sup> Buscicchi, Lorenzo. n.d. "The Experience Machine"
                    <a href="https://iep.utm.edu/experience-machine/">https://iep.utm.edu/experience-machine/</a>.
                </p>
                <p class='text footnote' id='f2' onclick="goToElementWithHighlightModern('fl2')">
                    <sup>2</sup> Nozick, Robert. 1974. <i>Anarchy, State, and Utopia.</i> New York: Basic Books.
                </p>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            // Should have all paragraphs
            const paragraphs = container.querySelectorAll('p')
            expect(paragraphs.length).toBeGreaterThanOrEqual(4)

            // Should have footnote links in content
            const footnoteLinks = container.querySelectorAll(
                "sup[data-footnote-target^='f']"
            )
            expect(footnoteLinks.length).toBe(2)

            // Should have citation paragraphs
            const citations = container.querySelectorAll(
                "p[data-footnote-target^='fl']"
            )
            expect(citations.length).toBe(2)

            // All links should have target="_blank"
            const links = container.querySelectorAll('a')
            links.forEach(link => {
                expect(link.getAttribute('target')).toBe('_blank')
            })
        })
    })

    describe('Special Characters and Formatting', () => {
        it('should preserve italic text', () => {
            const html = `<p>This is <i>italic</i> text</p>`

            const { container } = render(<ArticleHtmlContent html={html} />)

            const italic = container.querySelector('i')
            expect(italic).toBeTruthy()
            expect(italic?.textContent).toBe('italic')
        })

        it('should preserve bold text', () => {
            const html = `<p>This is <b>bold</b> text</p>`

            const { container } = render(<ArticleHtmlContent html={html} />)

            const bold = container.querySelector('b')
            expect(bold).toBeTruthy()
            expect(bold?.textContent).toBe('bold')
        })

        it('should handle nested elements', () => {
            const html = `
                <p>
                    <a href="https://example.com">
                        <b>Bold link</b>
                    </a>
                </p>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const link = container.querySelector('a')
            expect(link).toBeTruthy()
            expect(link?.getAttribute('target')).toBe('_blank')

            const bold = link?.querySelector('b')
            expect(bold).toBeTruthy()
            expect(bold?.textContent).toBe('Bold link')
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty HTML', () => {
            const html = ''

            const { container } = render(<ArticleHtmlContent html={html} />)

            expect(container.textContent).toBe('')
        })

        it('should handle plain text without HTML tags', () => {
            const html = 'Just plain text'

            const { container } = render(<ArticleHtmlContent html={html} />)

            expect(container.textContent).toBe('Just plain text')
        })

        it('should handle malformed onclick attribute', () => {
            const html = `
                <sup onclick="someOtherFunction()">1</sup>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const sup = container.querySelector('sup')
            expect(sup).toBeTruthy()
            // Should not have data-footnote-target if onclick doesn't match pattern
            expect(sup?.getAttribute('data-footnote-target')).toBeFalsy()
        })

        it('should handle elements with both class and onclick', () => {
            const html = `
                <span class="important" onclick="goToElementWithHighlightModern('target1')">
                    Click me
                </span>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const span = container.querySelector('span')
            expect(span).toBeTruthy()
            expect(span?.className).toContain('important')
            expect(span?.getAttribute('data-footnote-target')).toBe('target1')
        })
    })

    describe('Class Name Preservation', () => {
        it('should preserve className attributes', () => {
            const html = `
                <p class="text">Paragraph text</p>
                <div class="footnoteBorder"></div>
                <p class="text footnote">Citation</p>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const textParagraph = container.querySelector('p.text')
            expect(textParagraph).toBeTruthy()

            const border = container.querySelector('.footnoteBorder')
            expect(border).toBeTruthy()

            const citation = container.querySelector('.text.footnote')
            expect(citation).toBeTruthy()
        })

        it('should preserve multiple class names', () => {
            const html = `
                <a href="https://example.com" class="bold authorAttrName">Name</a>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const link = container.querySelector('a')
            expect(link?.className).toContain('bold')
            expect(link?.className).toContain('authorAttrName')
        })
    })
})
