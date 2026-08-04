import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { JSDOM } from 'jsdom'
import HTMLtoDOCX from 'html-to-docx'
import { convertArticleDocx } from '@/utils/docx-utils'
import { fixHTMLForDocx } from '@/scripts/fix-html-for-docx'

/**
 * Round-trip tests for HTML → .docx → HTML conversion
 * These tests ensure that the generation script produces .docx files
 * that convert back to HTML with proper formatting preserved
 */

const BASE_PATH = join(
    process.cwd(),
    '..',
    'BeetleInABox_Website'
)

describe('HTML → .docx → HTML Round-trip Tests', () => {
    describe('making-beauty.html formatting preservation', () => {
        it('should preserve inline italic formatting through round-trip conversion', async () => {
            // Read original HTML
            const htmlPath = join(BASE_PATH, 'Issue-1/making-beauty.html')
            const html = readFileSync(htmlPath, 'utf-8')
            const dom = new JSDOM(html)
            const document = dom.window.document

            // Extract the specific section with David and The Starry Night
            // In the original HTML, this is loose text in the .text.contents div, not in a <p> tag
            const contentDiv = document.querySelector('.text.contents')
            expect(contentDiv).toBeTruthy()

            const contentHTML = contentDiv!.innerHTML

            // Extract the section from "Perhaps" to "sublimity?"
            const startIdx = contentHTML.indexOf('Perhaps')
            const endIdx = contentHTML.indexOf('sublimity?') + 10
            const originalHTML = contentHTML.substring(startIdx, endIdx)

            // Original should have inline italics
            expect(originalHTML).toMatch(/faced <i>David<\/i> or <i>The Starry Night<\/i>/)

            // Fix HTML structure before conversion
            const fixedHTML = fixHTMLForDocx(originalHTML)

            // Convert to .docx
            const docxBuffer = await HTMLtoDOCX(fixedHTML, null, {
                table: { row: { cantSplit: true } },
                footer: true,
                pageNumber: true,
            }) as unknown as Buffer

            // Convert back to HTML using mammoth
            const { content: convertedHTML } = await convertArticleDocx(docxBuffer)

            // Check that italics are still inline, not broken into separate paragraphs
            expect(convertedHTML).not.toMatch(/<\/p>\s*<p>\s*<(em|i)>David<\/(em|i)>\s*<\/p>/)
            expect(convertedHTML).not.toMatch(/<\/p>\s*<p>\s*<(em|i)>The Starry Night<\/(em|i)>\s*<\/p>/)

            // Should not have standalone "or" paragraph
            expect(convertedHTML).not.toMatch(/<p>\s*or\s*<\/p>/i)

            // Should have David and The Starry Night in the same paragraph structure
            const hasInlineFormat =
                (convertedHTML.includes('<em>David</em>') || convertedHTML.includes('<i>David</i>')) &&
                (convertedHTML.includes('<em>The Starry Night</em>') || convertedHTML.includes('<i>The Starry Night</i>'))

            if (!hasInlineFormat) {
                console.error('Original HTML:', originalHTML)
                console.error('\nConverted HTML:', convertedHTML)
            }

            expect(hasInlineFormat).toBe(true)

            // Count paragraph breaks - should not have 5+ in a simple sentence
            const paraBreaks = (convertedHTML.match(/<\/p>/g) || []).length
            expect(paraBreaks).toBeLessThan(3) // Allow some paragraph structure, but not 5+
        })

        it('should preserve multiple inline italics in the same sentence', async () => {
            // Test HTML with multiple inline italics
            const testHTML = '<p>We like <i>David</i> and <i>The Starry Night</i> very much.</p>'

            // Fix HTML before conversion
            const fixedHTML = fixHTMLForDocx(testHTML)

            // Convert to .docx and back
            const docxBuffer = await HTMLtoDOCX(fixedHTML, null, {
                table: { row: { cantSplit: true } },
            }) as unknown as Buffer

            const { content: convertedHTML } = await convertArticleDocx(docxBuffer)

            // Should not break into separate paragraphs
            const paraCount = (convertedHTML.match(/<p>/g) || []).length

            if (paraCount > 2) {
                console.error('Test HTML:', testHTML)
                console.error('Converted HTML:', convertedHTML)
                console.error('Paragraph count:', paraCount)
            }

            expect(paraCount).toBeLessThanOrEqual(2) // At most 2 paragraphs, not 5+
        })
    })

    describe('General inline formatting preservation', () => {
        const testCases = [
            {
                name: 'single italic word',
                html: '<p>This is <i>italic</i> text.</p>',
                shouldNotMatch: /<\/p>\s*<p>\s*<i>italic<\/i>\s*<\/p>/,
            },
            {
                name: 'multiple italic words',
                html: '<p>Words like <i>hello</i> and <i>world</i> should stay inline.</p>',
                shouldNotMatch: /<\/p>\s*<p>\s*<i>/,
            },
            {
                name: 'italic with "or" between',
                html: '<p>Choose <i>this</i> or <i>that</i> option.</p>',
                shouldNotMatch: /<p>\s*or\s*<\/p>/i,
            },
            {
                name: 'bold text',
                html: '<p>This is <b>bold</b> text.</p>',
                shouldNotMatch: /<\/p>\s*<p>\s*<(b|strong)>bold<\/(b|strong)>\s*<\/p>/,
            },
            {
                name: 'emphasis',
                html: '<p>This is <em>emphasized</em> text.</p>',
                shouldNotMatch: /<\/p>\s*<p>\s*<em>emphasized<\/em>\s*<\/p>/,
            },
        ]

        it.each(testCases)(
            'should preserve $name through round-trip',
            async ({ html, shouldNotMatch }) => {
                // Fix HTML before conversion
                const fixedHTML = fixHTMLForDocx(html)

                const docxBuffer = await HTMLtoDOCX(fixedHTML, null, {
                    table: { row: { cantSplit: true } },
                }) as unknown as Buffer

                const { content: convertedHTML } = await convertArticleDocx(docxBuffer)

                if (shouldNotMatch.test(convertedHTML)) {
                    console.error('\nOriginal HTML:', html)
                    console.error('Converted HTML:', convertedHTML)
                }

                expect(convertedHTML).not.toMatch(shouldNotMatch)
            }
        )
    })

    describe('All Issue 1 articles round-trip validation', () => {
        const articles = [
            'making-beauty.html',
            'convenience-illusion.html',
            'only-thing.html',
            'hyperreality-cultural.html',
            'does-liberalism.html',
            'gossiping-tweens.html',
        ]

        it.each(articles)(
            '%s should not create standalone single-word paragraphs after round-trip',
            async (fileName) => {
                const htmlPath = join(BASE_PATH, `Issue-1/${fileName}`)
                const html = readFileSync(htmlPath, 'utf-8')
                const dom = new JSDOM(html)
                const document = dom.window.document

                const contentDiv = document.querySelector('.text.contents')
                if (!contentDiv) return

                // Get first paragraph with italic text
                const paragraphsWithItalics = Array.from(contentDiv.querySelectorAll('p')).filter(p =>
                    p.querySelector('i, em')
                )

                if (paragraphsWithItalics.length === 0) return

                const testParagraph = paragraphsWithItalics[0]
                const originalHTML = testParagraph.innerHTML

                // Fix HTML before conversion
                const fixedHTML = fixHTMLForDocx(originalHTML)

                // Convert to .docx and back
                const docxBuffer = await HTMLtoDOCX(fixedHTML, null, {
                    table: { row: { cantSplit: true } },
                }) as unknown as Buffer

                const { content: convertedHTML } = await convertArticleDocx(docxBuffer)

                // Check for standalone word paragraphs
                const badWords = ['or', 'and', 'but', 'the', 'a']
                for (const word of badWords) {
                    const pattern = new RegExp(`<p>\\s*${word}\\s*<\\/p>`, 'i')
                    if (pattern.test(convertedHTML)) {
                        console.error(`\n${fileName}: Found standalone <p>${word}</p>`)
                        console.error('Original HTML:', originalHTML.substring(0, 200))
                        console.error('Converted HTML:', convertedHTML.substring(0, 200))

                        throw new Error(
                            `${fileName} created standalone <p>${word}</p> after round-trip`
                        )
                    }
                }
            }
        )
    })
})
