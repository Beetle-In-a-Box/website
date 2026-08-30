import { describe, it, expect } from 'bun:test'
import HTMLtoDOCX from 'html-to-docx'
import { convertArticleDocx } from '@/utils/docx-utils'

// 1x1 transparent png
const PNG_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

async function docxFrom(html: string): Promise<Buffer> {
    const out = await HTMLtoDOCX(html)
    return Buffer.isBuffer(out)
        ? out
        : Buffer.from(await (out as Blob).arrayBuffer())
}

describe('docx feature support', () => {
    it('preserves em and en dashes', async () => {
        const buffer = await docxFrom(
            '<p>philosophy—the discipline–endures</p>'
        )
        const { content } = await convertArticleDocx(buffer)
        expect(content).toContain('—')
        expect(content).toContain('–')
    })

    it('drops a leading title heading but keeps later headings', async () => {
        const buffer = await docxFrom(
            '<h1>Searching the Self: A Successfully Failed Attempt</h1><p>body text opens here</p><h1>A Real Section</h1><p>more body</p>'
        )
        const { content } = await convertArticleDocx(buffer)
        expect(content).not.toContain('Searching the Self')
        expect(content).toContain('body text opens here')
        expect(content).toContain('A Real Section')
    })

    it('marks centered paragraphs with a centered class', async () => {
        const buffer = await docxFrom(
            '<p>plain text</p><p style="text-align: center">centered line</p>'
        )
        const { content } = await convertArticleDocx(buffer)
        expect(content).toMatch(/<p class="centered">\s*centered line/)
        expect(content).toMatch(/<p>\s*plain text/)
    })

    it('keeps inline images in the article body', async () => {
        const buffer = await docxFrom(
            `<p>before</p><img src="${PNG_DATA_URI}" alt="figure" /><p>after</p>`
        )
        const { content } = await convertArticleDocx(buffer)
        expect(content).toContain('<img')
        expect(content).toContain('data:image/png;base64')
    })

    it('splits out a footnote even when its paragraph is centered', async () => {
        const buffer = await docxFrom(
            '<p>a claim needing a source<sup>1</sup></p><p style="text-align: center"><sup>1</sup> a citation</p>'
        )
        const { citations } = await convertArticleDocx(buffer)
        expect(citations).not.toBeNull()
        expect(citations).toContain('a citation')
    })
})
