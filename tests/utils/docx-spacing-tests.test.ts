import { describe, it, expect } from 'bun:test'
import { readFile } from 'fs/promises'
import path from 'path'
import { convertArticleDocx } from '@/utils/docx-utils'

/**
 * Tests for proper spacing around inline formatting
 * These tests catch issues like:
 * - Missing spaces: "facedDavidonly"
 * - Extra spaces before punctuation: "Street ."
 */

const SEED_DOCX_DIR = path.join(
    process.cwd(),
    '..',
    'beetle-in-a-box',
    'scripts',
    'seed-docx'
)

describe('Spacing around inline formatting', () => {
    describe('making-beauty.docx spacing validation', () => {
        it('should have proper spaces around "David" and "The Starry Night"', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const result = await convertArticleDocx(buffer)
            const html = result.content

            // Find the paragraph
            const davidSection = html.substring(
                html.indexOf('Perhaps'),
                html.indexOf('sublimity?') + 10
            )

            // Should have spaces around italicized words
            expect(davidSection).toMatch(/faced <(em|i)>David<\/(em|i)> or/)
            expect(davidSection).toMatch(/or <(em|i)>The Starry Night<\/(em|i)> only/)

            // Should NOT have missing spaces (words mashed together)
            expect(davidSection).not.toContain('facedDavid')
            expect(davidSection).not.toContain('Davidor')
            expect(davidSection).not.toContain('orThe')
            expect(davidSection).not.toContain('Nightonly')
        })

        it('should NOT have space before punctuation after italic tags', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const result = await convertArticleDocx(buffer)
            const html = result.content

            // Find sections with italics followed by punctuation
            const giorgioSection = html.substring(
                html.indexOf('This is Giorgio'),
                html.indexOf('back then.') + 15
            )

            // "Mystery and Melancholy of a Street." should not have space before period
            expect(giorgioSection).toMatch(
                /<(em|i)>Mystery and Melancholy of a Street<\/(em|i)>\./
            )
            expect(giorgioSection).not.toMatch(
                /<(em|i)>Mystery and Melancholy of a Street<\/(em|i)> \./
            )

            // Check globally - no italic tags should be followed by space+punctuation
            expect(html).not.toMatch(/<\/(em|i)> \./g)
            expect(html).not.toMatch(/<\/(em|i)> ,/g)
            expect(html).not.toMatch(/<\/(em|i)> ;/g)
            expect(html).not.toMatch(/<\/(em|i)> :/g)
        })

        it('should have proper spacing before opening italic tags', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const result = await convertArticleDocx(buffer)
            const html = result.content

            // Words before opening italic tags should have spaces
            // "title <i>Mystery" not "title<i>Mystery"
            expect(html).not.toMatch(/[a-zA-Z0-9]<(em|i)>/)
        })

        it('should have proper spacing after closing italic tags before words', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const result = await convertArticleDocx(buffer)
            const html = result.content

            // Closing tags before words should have spaces
            // "</i> word" not "</i>word"
            // But NOT before punctuation
            const wordAfterItalic = html.match(/<\/(em|i)>[a-zA-Z]/g)

            if (wordAfterItalic && wordAfterItalic.length > 0) {
                console.error('Found italic tags directly followed by letters (missing space):')
                console.error(wordAfterItalic)
                throw new Error('Missing spaces after closing italic tags before words')
            }

            expect(wordAfterItalic).toBeNull()
        })
    })

    describe('All Issue 1 articles spacing validation', () => {
        const articles = [
            'making-beauty.docx',
            'convenience-illusion.docx',
            'only-thing.docx',
            'hyperreality-cultural.docx',
            'does-liberalism.docx',
            'gossiping-tweens.docx',
        ]

        it.each(articles)(
            '%s should not have spaces before punctuation after italic tags',
            async article => {
                const buffer = await readFile(
                    path.join(SEED_DOCX_DIR, article)
                )
                const result = await convertArticleDocx(buffer)
            const html = result.content

                // Common punctuation that should NOT have space before it
                const badPatterns = [
                    /<\/(em|i)> \./g,  // Space before period
                    /<\/(em|i)> ,/g,   // Space before comma
                    /<\/(em|i)> ;/g,   // Space before semicolon
                    /<\/(em|i)> :/g,   // Space before colon
                    /<\/(em|i)> \?/g,  // Space before question mark
                    /<\/(em|i)> !/g,   // Space before exclamation
                ]

                for (const pattern of badPatterns) {
                    const matches = html.match(pattern)
                    if (matches) {
                        console.error(`\n${article}: Found space before punctuation:`)
                        console.error(matches.slice(0, 5))
                        throw new Error(
                            `${article} has space before punctuation after italic tag`
                        )
                    }
                }
            }
        )

        it.each(articles)(
            '%s should have spaces around italic tags when adjacent to words',
            async article => {
                const buffer = await readFile(
                    path.join(SEED_DOCX_DIR, article)
                )
                const result = await convertArticleDocx(buffer)
            const html = result.content

                // Opening tag preceded by letter should have space
                const wordBeforeItalic = html.match(/[a-zA-Z0-9]<(em|i)>/g)

                if (wordBeforeItalic) {
                    console.error(`\n${article}: Missing space before italic tag:`)
                    console.error(wordBeforeItalic.slice(0, 5))
                    throw new Error(
                        `${article} missing space before opening italic tag`
                    )
                }

                // Closing tag followed by letter should have space
                const wordAfterItalic = html.match(/<\/(em|i)>[a-zA-Z]/g)

                if (wordAfterItalic) {
                    console.error(`\n${article}: Missing space after italic tag:`)
                    console.error(wordAfterItalic.slice(0, 5))
                    throw new Error(
                        `${article} missing space after closing italic tag`
                    )
                }
            }
        )
    })

    describe('Specific known patterns from Issue 1', () => {
        it('should correctly format "faced David or The Starry Night only"', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const result = await convertArticleDocx(buffer)
            const html = result.content

            // Exact expected pattern
            const hasCorrectPattern =
                html.includes('faced <em>David</em> or <em>The Starry Night</em> only') ||
                html.includes('faced <i>David</i> or <i>The Starry Night</i> only')

            if (!hasCorrectPattern) {
                const section = html.substring(
                    html.indexOf('Perhaps'),
                    html.indexOf('sublimity?') + 10
                )
                console.error('Expected: "faced <em>David</em> or <em>The Starry Night</em> only"')
                console.error('Actual section:', section)
            }

            expect(hasCorrectPattern).toBe(true)
        })

        it('should correctly format "Mystery and Melancholy of a Street."', async () => {
            const buffer = await readFile(
                path.join(SEED_DOCX_DIR, 'making-beauty.docx')
            )
            const result = await convertArticleDocx(buffer)
            const html = result.content

            // Should have NO space before period
            const hasCorrectPattern =
                html.includes('<em>Mystery and Melancholy of a Street</em>.') ||
                html.includes('<i>Mystery and Melancholy of a Street</i>.')

            if (!hasCorrectPattern) {
                const section = html.substring(
                    html.indexOf('Giorgio'),
                    html.indexOf('back then.') + 15
                )
                console.error('Expected: "<em>Mystery and Melancholy of a Street</em>." (no space before period)')
                console.error('Actual section:', section)
            }

            expect(hasCorrectPattern).toBe(true)
        })
    })
})
