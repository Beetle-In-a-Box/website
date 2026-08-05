import { describe, it, expect } from 'bun:test'
import {
    VARIANT_WIDTHS,
    parseVariantWidth,
    MAX_ORIGINAL_DIMENSION,
} from '@/utils/image-variants'

describe('parseVariantWidth', () => {
    it('accepts each allowlisted width', () => {
        for (const width of VARIANT_WIDTHS) {
            expect(parseVariantWidth(String(width))).toBe(width)
        }
    })

    it('rejects a width that is not on the allowlist', () => {
        expect(parseVariantWidth('401')).toBeNull()
        expect(parseVariantWidth('4000')).toBeNull()
        expect(parseVariantWidth('1')).toBeNull()
    })

    it('rejects junk without throwing', () => {
        expect(parseVariantWidth('abc')).toBeNull()
        expect(parseVariantWidth('')).toBeNull()
        expect(parseVariantWidth(null)).toBeNull()
        expect(parseVariantWidth(undefined)).toBeNull()
        expect(parseVariantWidth('400; DROP TABLE')).toBeNull()
        expect(parseVariantWidth('-400')).toBeNull()
        expect(parseVariantWidth('400.0')).toBeNull()
    })

    it('exposes the documented allowlist and original cap', () => {
        expect([...VARIANT_WIDTHS]).toEqual([400, 800, 1600])
        expect(MAX_ORIGINAL_DIMENSION).toBe(4000)
    })
})
