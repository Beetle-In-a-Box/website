import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/react'
import katex from 'katex'

import ArticleHtmlContent from '@/components/article/ArticleHtmlContent'

/**
 * Tests for ArticleHtmlContent component
 * Ensures HTML is safely converted to React with proper handling of:
 * - Images (plain <img>, never the platform image optimizer)
 * - Links (target="_blank" added)
 * - Footnotes (data attributes preserved)
 *
 * This file used to mock next/image into a plain <img> passthrough. The
 * component no longer imports next/image at all, so the mock was removed - it
 * would have hidden a regression back to the optimizer rather than catching it.
 */

/**
 * A 1x1 transparent GIF as a data: URI - the shape mammoth produces for images
 * embedded in a .docx. It inlines them as base64 rather than writing files, so
 * real article images arrive with no width/height attributes at all.
 */
const MAMMOTH_STYLE_DATA_URI =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

describe('ArticleHtmlContent', () => {
    describe('Image Conversion', () => {
        it('should render <img> tags as plain images', () => {
            const html = `
                <p>Here is an image:</p>
                <img src="/images/test.jpg" alt="Test Image" width="800" height="600" />
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const img = container.querySelector('img')
            expect(img).toBeTruthy()
            expect(img?.getAttribute('src')).toContain('test.jpg')
            expect(img?.getAttribute('alt')).toBe('Test Image')
        })

        it('should never route images through the platform image optimizer', () => {
            // The optimizer silently passes originals through on the deploy
            // host, so a /_next/image URL here is a regression, not an
            // optimization. Covers both a normal path and mammoth's data: URI.
            for (const src of ['/images/test.jpg', MAMMOTH_STYLE_DATA_URI]) {
                const { container } = render(
                    <ArticleHtmlContent html={`<img src="${src}" alt="" />`} />
                )

                const img = container.querySelector('img')
                expect(img?.getAttribute('src')).toBe(src)
                expect(container.innerHTML).not.toContain('/_next/image')
            }
        })

        it('should handle images without width/height attributes', () => {
            const html = `<img src="/images/test.jpg" alt="Test" />`

            const { container } = render(<ArticleHtmlContent html={html} />)

            const img = container.querySelector('img')
            expect(img).toBeTruthy()
        })

        it('should not invent intrinsic dimensions when the source omits them', () => {
            // The old code defaulted to 800x600, which reserves a
            // wrongly-shaped box for every mammoth image (they never carry
            // width/height) and makes the article jump when the image loads.
            const { container } = render(
                <ArticleHtmlContent
                    html={`<img src="${MAMMOTH_STYLE_DATA_URI}" alt="" />`}
                />
            )

            const img = container.querySelector('img')
            expect(img?.hasAttribute('width')).toBe(false)
            expect(img?.hasAttribute('height')).toBe(false)
        })

        it('should forward intrinsic dimensions when the source supplies them', () => {
            const html = `<img src="/images/test.jpg" alt="" width="640" height="480" />`

            const { container } = render(<ArticleHtmlContent html={html} />)

            const img = container.querySelector('img')
            expect(img?.getAttribute('width')).toBe('640')
            expect(img?.getAttribute('height')).toBe('480')
        })

        it('should lazy-load article images', () => {
            const html = `<img src="/images/test.jpg" alt="" />`

            const { container } = render(<ArticleHtmlContent html={html} />)

            const img = container.querySelector('img')
            expect(img?.getAttribute('loading')).toBe('lazy')
            expect(img?.getAttribute('decoding')).toBe('async')
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

    describe('Inline Style Parsing (KaTeX)', () => {
        it('renders an element with a CSS-text style attribute without throwing', () => {
            const html = `<span style="height:0.68em;margin-right:0.25em">x</span>`

            const { container } = render(<ArticleHtmlContent html={html} />)

            const span = container.querySelector('span')
            expect(span).toBeTruthy()
            expect(span?.textContent).toBe('x')
            expect(span?.style.height).toBe('0.68em')
            expect(span?.style.marginRight).toBe('0.25em')
        })

        it('keeps the footnote cursor-pointer style working alongside style parsing', () => {
            const html = `
                <sup class='footnoteLink' id='fl1' onclick="goToElementWithHighlightModern('f1')">1</sup>
            `

            const { container } = render(<ArticleHtmlContent html={html} />)

            const sup = container.querySelector('sup')
            expect(sup?.style.cursor).toBe('pointer')
        })

        it('renders real katex.renderToString output without throwing', () => {
            const katexHtml = katex.renderToString('\\frac{a}{b}', {
                throwOnError: false,
            })

            const { container } = render(
                <ArticleHtmlContent html={`<p>${katexHtml}</p>`} />
            )

            const katexSpan = container.querySelector('.katex')
            expect(katexSpan).toBeTruthy()
            // KaTeX emits many spans with inline style="height:...;..." -
            // if any survived as a raw string prop, render() above would
            // have thrown before this assertion is reached.
            const styledSpans = container.querySelectorAll('[style]')
            expect(styledSpans.length).toBeGreaterThan(0)
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
