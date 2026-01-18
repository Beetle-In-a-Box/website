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

/*
 * NOTE: Tests for convertArticleDocx(), convertCitationsDocx(), and convertPreviewDocx()
 * are skipped here due to Bun mocking issues with the mammoth library.
 * These functions are thoroughly tested via the API integration tests in
 * tests/api/articles.test.ts where they are called with actual .docx file processing.
 */
