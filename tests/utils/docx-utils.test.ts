import { describe, it, expect } from 'bun:test'
import { generateFileName } from '@/utils/docx-utils'

describe('generateFileName', () => {
    it('should generate filename from two-word title', () => {
        expect(generateFileName('Hello World')).toBe('hello-world')
        expect(generateFileName('Test Article')).toBe('test-article')
    })

    it('should generate filename from multi-word title using first two words', () => {
        expect(generateFileName('This Is A Long Title')).toBe('this-is')
        expect(generateFileName('Understanding Quantum Physics Today')).toBe(
            'understanding-quantum',
        )
    })

    it('should remove common words before selecting two words', () => {
        expect(generateFileName('The Quick Brown Fox')).toBe('quick-brown')
        expect(generateFileName('A Study of Philosophy')).toBe(
            'study-philosophy',
        )
        expect(generateFileName('On the Nature of Reality')).toBe(
            'nature-reality',
        )
    })

    it('should handle single word titles', () => {
        expect(generateFileName('Philosophy')).toBe('philosophy')
        expect(generateFileName('Title')).toBe('title')
    })

    it('should remove punctuation from titles', () => {
        expect(generateFileName("What's Philosophy?")).toBe(
            'whats-philosophy',
        )
        expect(generateFileName('Mind, Body, and Soul')).toBe('mind-body')
        expect(generateFileName('The "Real" World')).toBe('real-world')
    })

    it('should handle titles with all common words', () => {
        // If all words are common, it should still try to use what's available
        expect(generateFileName('The And Or')).toBe('')
        expect(generateFileName('A The Of')).toBe('')
    })

    it('should handle titles with mixed case', () => {
        expect(generateFileName('The QUICK Brown FOX')).toBe('quick-brown')
        expect(generateFileName('CamelCase Title')).toBe('camelcase-title')
    })

    it('should handle titles with extra whitespace', () => {
        expect(generateFileName('  Hello   World  ')).toBe('hello-world')
        expect(generateFileName('Test  Multiple   Spaces')).toBe(
            'test-multiple',
        )
    })

    it('should handle titles with numbers', () => {
        expect(generateFileName('Article 123 Test')).toBe('article-123')
        expect(generateFileName('2024 Philosophy Review')).toBe(
            '2024-philosophy',
        )
    })

    it('should handle titles with special characters and spaces', () => {
        expect(generateFileName('Hello... World!!!')).toBe('hello-world')
        expect(generateFileName('Test & Article')).toBe('test-article')
    })

    it('should handle edge case with only one non-common word', () => {
        expect(generateFileName('The Philosophy')).toBe('philosophy')
        expect(generateFileName('A Test')).toBe('test')
    })
})

import { convertArticleDocx, convertPreviewDocx } from '@/utils/docx-utils'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('docx conversion functions', () => {
    it('should extract all footnotes from Vienna Gaspar article (Hyperreality) using <sup> format', async () => {
        // This test validates that all footnotes are properly extracted from .docx files
        // Previously, only 1-4 footnotes were being extracted instead of all 7
        const docxPath = join(process.cwd(), 'scripts/seed-docx/hyperreality-cultural.docx')
        const buffer = readFileSync(docxPath)

        const result = await convertArticleDocx(buffer)

        // The article should have 7 footnotes
        const footnoteMatches = result.citations?.match(/id='f\d+'/g) || []
        expect(footnoteMatches.length).toBe(7)

        // Verify footnotes are numbered 1-7 in order
        expect(result.citations).toContain("id='f1'")
        expect(result.citations).toContain("id='f2'")
        expect(result.citations).toContain("id='f3'")
        expect(result.citations).toContain("id='f4'")
        expect(result.citations).toContain("id='f5'")
        expect(result.citations).toContain("id='f6'")
        expect(result.citations).toContain("id='f7'")

        // Verify key citation content is present
        expect(result.citations).toContain('Jean Baudrillard')
        expect(result.citations).toContain('Simulacra and Simulation')
        expect(result.citations).toContain('Rolling Stone')
    })

    it('should properly separate article content from footnotes', async () => {
        const docxPath = join(process.cwd(), 'scripts/seed-docx/hyperreality-cultural.docx')
        const buffer = readFileSync(docxPath)

        const result = await convertArticleDocx(buffer)

        // Main content should have the article text but NOT the footnote content
        expect(result.content).toContain('Jean Baudrillard')
        expect(result.content).not.toContain('University Of Michigan Press')

        // Citations should have the footnote content
        expect(result.citations).toContain('University Of Michigan Press')
    })

    // Note: To test [1], [2] endnote format, create a .docx file manually with:
    // - Main text: "Article text with reference [1] and [2]"
    // - End of document: "[1] First citation\n[2] Second citation"
    // The parser will recognize both <sup> (Word footnotes) and [NUMBER] (manually typed) formats

    it('should extract preview text without formatting', async () => {
        const docxPath = join(process.cwd(), 'scripts/seed-docx/hyperreality-cultural.docx')
        const buffer = readFileSync(docxPath)

        const preview = await convertPreviewDocx(buffer)

        // Preview should contain main article text
        expect(preview).toContain('simulation')
        expect(preview.length).toBeGreaterThan(100) // Should be a substantial preview
    })
})
