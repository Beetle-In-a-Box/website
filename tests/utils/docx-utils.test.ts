import { describe, it, expect } from 'bun:test'
import { generateFileName } from '@/utils/docx-utils'

describe('generateFileName', () => {
    it('should generate filename from two-word title', () => {
        expect(generateFileName('Hello World')).toBe('hello-world.html')
        expect(generateFileName('Test Article')).toBe('test-article.html')
    })

    it('should generate filename from multi-word title using first two words', () => {
        expect(generateFileName('This Is A Long Title')).toBe('this-is.html')
        expect(generateFileName('Understanding Quantum Physics Today')).toBe(
            'understanding-quantum.html',
        )
    })

    it('should remove common words before selecting two words', () => {
        expect(generateFileName('The Quick Brown Fox')).toBe('quick-brown.html')
        expect(generateFileName('A Study of Philosophy')).toBe(
            'study-philosophy.html',
        )
        expect(generateFileName('On the Nature of Reality')).toBe(
            'nature-reality.html',
        )
    })

    it('should handle single word titles', () => {
        expect(generateFileName('Philosophy')).toBe('philosophy.html')
        expect(generateFileName('Title')).toBe('title.html')
    })

    it('should remove punctuation from titles', () => {
        expect(generateFileName("What's Philosophy?")).toBe(
            'whats-philosophy.html',
        )
        expect(generateFileName('Mind, Body, and Soul')).toBe('mind-body.html')
        expect(generateFileName('The "Real" World')).toBe('real-world.html')
    })

    it('should handle titles with all common words', () => {
        // If all words are common, it should still try to use what's available
        expect(generateFileName('The And Or')).toBe('.html')
        expect(generateFileName('A The Of')).toBe('.html')
    })

    it('should handle titles with mixed case', () => {
        expect(generateFileName('The QUICK Brown FOX')).toBe('quick-brown.html')
        expect(generateFileName('CamelCase Title')).toBe('camelcase-title.html')
    })

    it('should handle titles with extra whitespace', () => {
        expect(generateFileName('  Hello   World  ')).toBe('hello-world.html')
        expect(generateFileName('Test  Multiple   Spaces')).toBe(
            'test-multiple.html',
        )
    })

    it('should handle titles with numbers', () => {
        expect(generateFileName('Article 123 Test')).toBe('article-123.html')
        expect(generateFileName('2024 Philosophy Review')).toBe(
            '2024-philosophy.html',
        )
    })

    it('should handle titles with special characters and spaces', () => {
        expect(generateFileName('Hello... World!!!')).toBe('hello-world.html')
        expect(generateFileName('Test & Article')).toBe('test-article.html')
    })

    it('should handle edge case with only one non-common word', () => {
        expect(generateFileName('The Philosophy')).toBe('philosophy.html')
        expect(generateFileName('A Test')).toBe('test.html')
    })
})

/*
 * NOTE: Tests for convertArticleDocx(), convertCitationsDocx(), and convertPreviewDocx()
 * are skipped here due to Bun mocking issues with the mammoth library.
 * These functions are thoroughly tested via the API integration tests in
 * tests/api/articles.test.ts where they are called with actual .docx file processing.
 */
