import { describe, it, expect } from 'bun:test'
import { readFile } from 'fs/promises'
import path from 'path'
import {
    convertArticleDocx,
    convertCitationsDocx,
    convertPreviewDocx,
    generateFileName,
} from '@/utils/docx-utils'

/**
 * Integration tests for .docx conversion using actual seed data
 * These tests ensure that Issue 1 articles convert correctly
 */

const SEED_DOCX_DIR = path.join(
    process.cwd(),
    '..',
    'beetle-in-a-box',
    'scripts',
    'seed-docx'
)

describe('docx-utils.ts - Integration Tests with Seed Data', () => {
    describe('convertArticleDocx', () => {
        it('should convert convenience-illusion.docx with proper footnote formatting', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const html = await convertArticleDocx(buffer)

            // Should contain footnote links with proper IDs and onclick
            expect(html).toContain(
                `<sup class='footnoteLink' id='fl1' onclick="goToElementWithHighlightModern('f1')">`
            )
            expect(html).toContain(
                `<sup class='footnoteLink' id='fl2' onclick="goToElementWithHighlightModern('f2')">`
            )
            expect(html).toContain(
                `<sup class='footnoteLink' id='fl3' onclick="goToElementWithHighlightModern('f3')">`
            )

            // Should contain paragraph tags
            expect(html).toContain('<p>')
            expect(html).toContain('</p>')

            // Should contain the article content
            expect(html).toContain('experience machine')
            expect(html).toContain('Robert Nozick')
        })

        it('should convert does-liberalism.docx (longer article) correctly', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'does-liberalism.docx')
            )
            const html = await convertArticleDocx(buffer)

            // Should contain footnotes (this article has many)
            expect(html).toContain(
                `<sup class='footnoteLink' id='fl1' onclick="goToElementWithHighlightModern('f1')">`
            )

            // Count the number of footnotes
            const footnoteCount = (html.match(/<sup class='footnoteLink'/g) || [])
                .length
            expect(footnoteCount).toBeGreaterThan(5) // Long article should have multiple footnotes

            // Should contain expected content
            expect(html).toContain('liberalism')
        })

        it('should auto-link URLs in article content', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const html = await convertArticleDocx(buffer)

            // If the article contains URLs, they should be linked
            // Check for both http and https
            if (html.includes('http://') || html.includes('https://')) {
                expect(html).toMatch(/<a href="https?:\/\/[^"]+">/)
            }
        })

        it('should clean special characters from docx', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const html = await convertArticleDocx(buffer)

            // Should have converted curly quotes to straight quotes
            expect(html).not.toContain('\u201c') // Left double quote
            expect(html).not.toContain('\u201d') // Right double quote
            expect(html).not.toContain('\u2018') // Left single quote
            expect(html).not.toContain('\u2019') // Right single quote

            // Should have converted dashes
            expect(html).not.toContain('\u2013') // En dash
            expect(html).not.toContain('\u2014') // Em dash

            // Should have converted non-breaking spaces
            expect(html).not.toContain('\u00a0')
        })

        it('should handle all Issue 1 articles without errors', async () => {
            const articles = [
                'convenience-illusion.docx',
                'does-liberalism.docx',
                'gossiping-tweens.docx',
                'hyperreality-cultural.docx',
                'making-beauty.docx',
                'only-thing.docx',
            ]

            for (const article of articles) {
                const buffer = await readFile(path.join(SEED_DOCX_DIR, article))
                const html = await convertArticleDocx(buffer)

                // Basic checks
                expect(html).toBeTruthy()
                expect(html.length).toBeGreaterThan(100)
                expect(html).toContain('<p>')
            }
        })
    })

    describe('convertCitationsDocx', () => {
        it('should convert citations with clickable footnotes', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            // Note: convertCitationsDocx treats each paragraph as a separate citation
            // This is the expected behavior - it wraps every paragraph as a footnote
            const html = await convertCitationsDocx(buffer)

            // Should contain footnote paragraphs with IDs
            expect(html).toMatch(
                /<p class='text footnote' id='f\d+' onclick="goToElementWithHighlightModern\('fl\d+'\)">/
            )

            // Should contain paragraph tags and closing tags
            expect(html).toContain("<p class='text footnote'")
            expect(html).toContain('</p>')
        })

        it('should auto-link URLs in citations', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const html = await convertCitationsDocx(buffer)

            // Citations often contain URLs
            if (html.includes('http://') || html.includes('https://')) {
                expect(html).toMatch(/<a href="https?:\/\/[^"]+">/)
            }
        })

        it('should clean special characters from citations', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const html = await convertCitationsDocx(buffer)

            // Should have cleaned special characters
            expect(html).not.toContain('\u201c')
            expect(html).not.toContain('\u201d')
            expect(html).not.toContain('\u2018')
            expect(html).not.toContain('\u2019')
        })

        it('should handle all Issue 1 citations without errors', async () => {
            const articles = [
                'convenience-illusion.docx',
                'does-liberalism.docx',
                'gossiping-tweens.docx',
                'hyperreality-cultural.docx',
                'making-beauty.docx',
                'only-thing.docx',
            ]

            for (const article of articles) {
                const buffer = await readFile(path.join(SEED_DOCX_DIR, article))
                const html = await convertCitationsDocx(buffer)

                expect(html).toBeTruthy()
                expect(html.length).toBeGreaterThan(0)
            }
        })
    })

    describe('convertPreviewDocx', () => {
        it('should extract plain text preview from convenience-illusion.docx', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const preview = await convertPreviewDocx(buffer)

            // Should be plain text (no HTML tags)
            expect(preview).not.toContain('<p>')
            expect(preview).not.toContain('<sup>')
            expect(preview).not.toContain('<a>')

            // Should contain article content
            expect(preview).toContain('experience machine')
            expect(preview).toContain('Robert Nozick')

            // Should have no excessive whitespace
            expect(preview).not.toMatch(/\s{2,}/) // No multiple spaces
            expect(preview).not.toContain('\n') // No newlines

            // Should be a reasonable length
            expect(preview.length).toBeGreaterThan(100)
        })

        it('should handle all Issue 1 articles and produce reasonable previews', async () => {
            const articles = [
                'convenience-illusion.docx',
                'does-liberalism.docx',
                'gossiping-tweens.docx',
                'hyperreality-cultural.docx',
                'making-beauty.docx',
                'only-thing.docx',
            ]

            for (const article of articles) {
                const buffer = await readFile(path.join(SEED_DOCX_DIR, article))
                const preview = await convertPreviewDocx(buffer)

                // Should be plain text (no HTML tags at all)
                // This will FAIL if there are malformed tags in the source .docx
                expect(preview).not.toContain('<')
                expect(preview).not.toContain('>')

                // Should have content
                expect(preview.length).toBeGreaterThan(50)

                // Should have no excessive whitespace
                expect(preview).not.toMatch(/\s{2,}/)
            }
        })
    })

    describe('generateFileName', () => {
        it('should generate correct filenames for Issue 1 articles', () => {
            // Use the actual titles from the seed script
            const testCases = [
                {
                    title: 'Making Beauty In Ugly Things',
                    expected: 'making-beauty.html',
                },
                {
                    title: 'The Convenience of Illusion: Are We Truly Committed to Reality?',
                    expected: 'convenience-illusion.html',
                },
                {
                    title: 'The Only Thing We Fear Is You: How Chernobyl Turned Fear of The Unknown Into Fear of Ourselves',
                    expected: 'only-thing.html',
                },
                {
                    title: 'Hyperreality: A Cultural Analysis',
                    expected: 'hyperreality-cultural.html',
                },
                {
                    title: 'Does Liberalism Understand People?',
                    expected: 'does-liberalism.html',
                },
                {
                    title: 'Gossiping Tweens & Ending Regimes: The Promises & Pitfalls of the Doctrine of Double Effect',
                    expected: 'gossiping-tweens.html',
                },
            ]

            for (const { title, expected } of testCases) {
                const result = generateFileName(title)
                expect(result).toBe(expected)
            }
        })

        it('should filter common words', () => {
            const result = generateFileName('A Guide to the Theory of Everything')
            expect(result).toBe('guide-theory.html')
        })

        it('should handle single-word titles', () => {
            const result = generateFileName('Philosophy')
            expect(result).toBe('philosophy.html')
        })

        it('should remove punctuation', () => {
            const result = generateFileName("What's the Point? A Question")
            expect(result).toBe('whats-point.html')
        })
    })

    describe('Footnote Numbering Consistency', () => {
        it('should number article footnotes sequentially starting from 1', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const articleHtml = await convertArticleDocx(buffer)

            // Extract footnote numbers from article
            const articleFootnotes =
                articleHtml.match(/id='fl(\d+)'/g)?.map(match => {
                    const num = match.match(/\d+/)
                    return num ? parseInt(num[0]) : 0
                }) || []

            // Should start from 1 and be sequential
            expect(articleFootnotes[0]).toBe(1)

            // Should be sequential (1, 2, 3, ...)
            for (let i = 0; i < articleFootnotes.length; i++) {
                expect(articleFootnotes[i]).toBe(i + 1)
            }

            // Should have at least 3 footnotes in this article
            expect(articleFootnotes.length).toBeGreaterThanOrEqual(3)
        })

        it('should number citation footnotes sequentially starting from 1', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const citationsHtml = await convertCitationsDocx(buffer)

            // Extract footnote numbers from citations
            // Note: convertCitationsDocx treats each paragraph as a citation
            const citationFootnotes =
                citationsHtml.match(/id='f(\d+)'/g)?.map(match => {
                    const num = match.match(/\d+/)
                    return num ? parseInt(num[0]) : 0
                }) || []

            // Should start from 1
            expect(citationFootnotes[0]).toBe(1)

            // Should be sequential (1, 2, 3, ...)
            for (let i = 0; i < citationFootnotes.length; i++) {
                expect(citationFootnotes[i]).toBe(i + 1)
            }
        })
    })

    describe('URL Auto-linking', () => {
        it('should convert various URL formats to links', async () => {
            // Create a mock docx with URLs (this would require mammoth mocking)
            // For now, test the autolinkUrls function indirectly through conversion

            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'convenience-illusion.docx')
            )
            const html = await convertArticleDocx(buffer)

            // If URLs exist in the article, they should be linked
            const urlPattern = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)]/
            const linkPattern = /<a href="https?:\/\/[^"]+">https?:\/\/[^<]+<\/a>/

            // Find plain URLs (not already linked)
            const plainUrls = html.match(urlPattern)

            // All URLs should be inside <a> tags
            if (plainUrls) {
                for (const url of plainUrls) {
                    // URL should be part of an <a> tag
                    expect(html).toContain(`<a href="${url}">${url}</a>`)
                }
            }
        })
    })
})
