import { describe, it, expect } from 'bun:test'
import JSZip from 'jszip'
import { preprocessDocxMath, renderMathMarkers } from '@/utils/math-utils'
import { convertArticleDocx } from '@/utils/docx-utils'

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

function documentXmlWithFraction(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
<w:body>
<w:p><w:r><w:t>before equation</w:t></w:r></w:p>
<w:p><m:oMath><m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:r><m:t>b</m:t></m:r></m:den></m:f></m:oMath></w:p>
<w:p><w:r><w:t>after equation</w:t></w:r></w:p>
<w:sectPr/>
</w:body>
</w:document>`
}

function documentXmlWithDisplayFraction(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
<w:body>
<w:p><w:r><w:t>before display equation</w:t></w:r></w:p>
<w:p><m:oMathPara><m:oMath><m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:r><m:t>b</m:t></m:r></m:den></m:f></m:oMath></m:oMathPara></w:p>
<w:p><w:r><w:t>after display equation</w:t></w:r></w:p>
<w:sectPr/>
</w:body>
</w:document>`
}

async function buildMinimalDocx(documentXml: string): Promise<Buffer> {
    const zip = new JSZip()
    zip.file('[Content_Types].xml', CONTENT_TYPES_XML)
    zip.folder('_rels')!.file('.rels', RELS_XML)
    zip.folder('word')!.file('document.xml', documentXml)
    return zip.generateAsync({ type: 'nodebuffer' })
}

describe('renderMathMarkers', () => {
    it('expands an inline math marker into KaTeX HTML', () => {
        const payload = { latex: '\\frac{a}{b}', display: false }
        const marker = `@@MATH:${Buffer.from(JSON.stringify(payload)).toString('base64')}@@`
        const html = `<p>see ${marker} here</p>`
        const result = renderMathMarkers(html)
        expect(result).toContain('katex')
        expect(result).not.toContain('@@MATH:')
    })

    it('leaves malformed markers untouched', () => {
        const html = '<p>see @@MATH:not-valid-base64!!!@@ here</p>'
        const result = renderMathMarkers(html)
        expect(result).toContain('@@MATH:not-valid-base64!!!@@')
    })
})

describe('preprocessDocxMath', () => {
    it('returns the buffer unchanged when the docx has no OMML', async () => {
        const buffer = await buildMinimalDocx(
            `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>no math here</w:t></w:r></w:p></w:body></w:document>`
        )
        const result = await preprocessDocxMath(buffer)
        expect(result).toBe(buffer)
    })

    it('replaces an m:oMath fraction with a base64 math marker in document.xml', async () => {
        const buffer = await buildMinimalDocx(documentXmlWithFraction())
        const processed = await preprocessDocxMath(buffer)
        const zip = await JSZip.loadAsync(processed)
        const xml = await zip.file('word/document.xml')!.async('string')

        expect(xml).not.toContain('<m:oMath')
        expect(xml).toMatch(/@@MATH:[A-Za-z0-9+/=]+@@/)

        const match = xml.match(/@@MATH:([A-Za-z0-9+/=]+)@@/)
        expect(match).not.toBeNull()
        const payload = JSON.parse(
            Buffer.from(match![1], 'base64').toString('utf8')
        )
        expect(payload.latex).toContain('frac')
        expect(payload.display).toBe(false)
    })
})

describe('convertArticleDocx with embedded OMML equations', () => {
    it('renders the equation as KaTeX HTML in the article content', async () => {
        const buffer = await buildMinimalDocx(documentXmlWithFraction())

        let content: string
        try {
            ;({ content } = await convertArticleDocx(buffer))
        } catch (error) {
            // Some mammoth versions are picky about a hand-built minimal
            // docx even once it round-trips through JSZip cleanly. If
            // mammoth itself refuses this fixture, the two suites above
            // (preprocessDocxMath output + renderMathMarkers) already cover
            // the OMML->marker and marker->KaTeX halves of the pipeline
            // independently, so fail loudly with that context instead of
            // silently skipping.
            throw new Error(
                `mammoth could not parse the hand-built fixture docx (preprocessDocxMath + renderMathMarkers are covered independently above): ${error instanceof Error ? error.message : String(error)}`
            )
        }

        expect(content).toContain('before equation')
        expect(content).toContain('after equation')
        expect(content).not.toContain('@@MATH:')
        expect(content).toContain('katex')
        expect(content).toContain('frac')
    })

    it('renders an m:oMathPara-wrapped equation in KaTeX display mode', async () => {
        const buffer = await buildMinimalDocx(documentXmlWithDisplayFraction())

        let content: string
        try {
            ;({ content } = await convertArticleDocx(buffer))
        } catch (error) {
            throw new Error(
                `mammoth could not parse the hand-built oMathPara fixture docx: ${error instanceof Error ? error.message : String(error)}`
            )
        }

        expect(content).toContain('before display equation')
        expect(content).toContain('after display equation')
        expect(content).not.toContain('@@MATH:')
        // The presence of *any* katex span was already proven above for the
        // bare oMath (inline) case. This asserts displayMode: true actually
        // flowed through the oMathPara branch specifically, not just that
        // some katex markup exists.
        expect(content).toContain('katex-display')
    })
})
