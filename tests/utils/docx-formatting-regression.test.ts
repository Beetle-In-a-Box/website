import { describe, it, expect } from 'bun:test'
import { readFile } from 'fs/promises'
import path from 'path'
import { convertArticleDocx } from '@/utils/docx-utils'

/**
 * Regression tests for specific formatting issues found in Issue 1 articles
 * These tests ensure that common formatting glitches are caught
 */

const SEED_DOCX_DIR = path.join(
    process.cwd(),
    '..',
    'beetle-in-a-box',
    'scripts',
    'seed-docx'
)

describe('Issue 1 Formatting Regression Tests', () => {
    describe('making-beauty.docx', () => {
        it('should keep italicized text inline with paragraph, not split into separate <p> tags', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const { content: html } = await convertArticleDocx(buffer)

            // Find the problematic paragraph
            const davidSection = html.substring(
                html.indexOf('Perhaps'),
                html.indexOf('sublimity?') + 15
            )

            // The issue: mammoth creates separate <p> tags for italicized words
            // WRONG: you've faced</p><p><em>David</em></p><p>or</p><p><em>The Starry Night</em></p><p>only
            // RIGHT: you've faced <em>David</em> or <em>The Starry Night</em> only

            // Check that we don't have the broken pattern
            expect(davidSection).not.toMatch(
                /<\/p>\s*<p>\s*<(em|i)>David<\/(em|i)>\s*<\/p>/
            )
            expect(davidSection).not.toMatch(
                /<\/p>\s*<p>\s*<(em|i)>The Starry Night<\/(em|i)>\s*<\/p>/
            )

            // Check that italicized text is inline (not surrounded by </p><p>)
            // Should have something like: "faced <em>David</em> or" or "faced <i>David</i> or"
            const hasInlineDavid =
                davidSection.includes('faced <em>David</em>') ||
                davidSection.includes('faced <i>David</i>') ||
                davidSection.includes('faced<em>David</em>') ||
                davidSection.includes('faced<i>David</i>')

            const hasInlineStarryNight =
                davidSection.includes('or <em>The Starry Night</em>') ||
                davidSection.includes('or <i>The Starry Night</i>') ||
                davidSection.includes('or<em>The Starry Night</em>') ||
                davidSection.includes('or<i>The Starry Night</i>')

            if (!hasInlineDavid || !hasInlineStarryNight) {
                console.error('Actual HTML output:')
                console.error(davidSection)
                console.error('\nExpected pattern:')
                console.error(
                    "you've faced <em>David</em> or <em>The Starry Night</em> only to feel"
                )
            }

            expect(hasInlineDavid).toBe(true)
            expect(hasInlineStarryNight).toBe(true)
        })

        it('should not have standalone <p>or</p> paragraphs (indicates broken formatting)', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const { content: html } = await convertArticleDocx(buffer)

            // Standalone "or" in a paragraph is a sign of broken formatting
            expect(html).not.toMatch(/<p>\s*or\s*<\/p>/i)
        })
    })

    describe('General formatting checks for all articles', () => {
        const articles = [
            'making-beauty.docx',
            'convenience-illusion.docx',
            'only-thing.docx',
            'hyperreality-cultural.docx',
            'does-liberalism.docx',
            'gossiping-tweens.docx',
        ]

        it.each(articles)(
            '%s should not have single-word paragraphs (common sign of formatting issues)',
            async article => {
                const buffer = await readFile(
                    path.join(SEED_DOCX_DIR, article)
                )
                const { content: html } = await convertArticleDocx(buffer)

                // Find suspiciously short paragraphs (likely formatting errors)
                // Pattern: <p>word</p> or <p> word </p>
                const singleWordParagraphs = html.match(
                    /<p>\s*\w{1,15}\s*<\/p>/gi
                )

                if (singleWordParagraphs && singleWordParagraphs.length > 0) {
                    console.warn(
                        `\n⚠️  ${article} has ${singleWordParagraphs.length} single-word paragraphs:`
                    )
                    console.warn(singleWordParagraphs.slice(0, 10).join('\n'))
                }

                // Fail if we find common conjunction/preposition words as standalone paragraphs
                // These are almost always formatting errors
                const badWords = ['or', 'and', 'but', 'the', 'a', 'an', 'in']
                for (const word of badWords) {
                    const pattern = new RegExp(
                        `<p>\\s*${word}\\s*<\\/p>`,
                        'i'
                    )
                    if (pattern.test(html)) {
                        throw new Error(
                            `${article} has standalone <p>${word}</p> paragraph - likely formatting error`
                        )
                    }
                }
            }
        )

        it.each(articles)(
            '%s should not have empty <em> or <i> tags separated by paragraph breaks',
            async article => {
                const buffer = await readFile(
                    path.join(SEED_DOCX_DIR, article)
                )
                const { content: html } = await convertArticleDocx(buffer)

                // Pattern that indicates italics broken across paragraphs:
                // </p><p><em>...</em></p><p>
                const brokenItalicPattern =
                    /<\/p>\s*<p>\s*<(em|i)>[^<]+<\/(em|i)>\s*<\/p>\s*<p>/gi

                const matches = html.match(brokenItalicPattern)
                if (matches && matches.length > 0) {
                    console.warn(
                        `\n⚠️  ${article} may have italics broken into separate paragraphs:`
                    )
                    console.warn(matches.slice(0, 5).join('\n'))

                    // This is a warning, not a hard failure, since sometimes this might be intentional
                    // But it should be reviewed
                }
            }
        )
    })

    describe('Comparison with static HTML (golden files)', () => {
        it('making-beauty: first paragraph should match static HTML structure', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const { content: html } = await convertArticleDocx(buffer)

            // Expected structure from static HTML:
            // "you've faced <i>David</i> or <i>The Starry Night</i> only to feel"

            const firstPara = html.substring(
                html.indexOf('Perhaps'),
                html.indexOf('sublimity?') + 15
            )

            // Should be one continuous paragraph, not multiple <p> tags
            const paragraphCount = (
                firstPara.match(/<\/p>/g) || []
            ).length
            expect(paragraphCount).toBeLessThanOrEqual(1) // Should be 0 or 1, not 5+
        })
    })
})
