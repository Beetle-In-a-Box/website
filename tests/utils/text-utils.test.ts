import { describe, it, expect } from 'bun:test'
import { unescapeHtml } from '@/utils/text-utils'

describe('unescapeHtml', () => {
    it('should unescape common HTML entities', () => {
        expect(unescapeHtml('&lt;')).toBe('<')
        expect(unescapeHtml('&gt;')).toBe('>')
        expect(unescapeHtml('&amp;')).toBe('&')
        expect(unescapeHtml('&quot;')).toBe('"')
        expect(unescapeHtml('&#39;')).toBe("'")
        expect(unescapeHtml('&apos;')).toBe("'")
    })

    it('should unescape multiple entities in one string', () => {
        expect(unescapeHtml('&lt;div&gt;Hello &amp; Goodbye&lt;/div&gt;')).toBe(
            '<div>Hello & Goodbye</div>',
        )
        expect(unescapeHtml('&quot;Hello&quot; &amp; &apos;World&apos;')).toBe(
            '"Hello" & \'World\'',
        )
    })

    it('should handle strings with no entities', () => {
        expect(unescapeHtml('Hello World')).toBe('Hello World')
        expect(unescapeHtml('No entities here!')).toBe('No entities here!')
        expect(unescapeHtml('')).toBe('')
    })

    it('should leave unknown entities unchanged', () => {
        expect(unescapeHtml('&unknown;')).toBe('&unknown;')
        expect(unescapeHtml('&fake;entity&test;')).toBe('&fake;entity&test;')
    })

    it('should handle mixed known and unknown entities', () => {
        expect(unescapeHtml('&lt;div&gt; &unknown; &amp;')).toBe(
            '<div> &unknown; &',
        )
    })

    it('should handle numeric character references', () => {
        // Numeric entities that aren't in our map should remain unchanged
        expect(unescapeHtml('&#169;')).toBe('&#169;')
        expect(unescapeHtml('&#8364;')).toBe('&#8364;')
    })

    it('should handle text with ampersands that are not entities', () => {
        expect(unescapeHtml('This & that')).toBe('This & that')
        expect(unescapeHtml('&amp; this &amp; that')).toBe('& this & that')
    })
})
