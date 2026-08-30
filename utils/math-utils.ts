import JSZip from 'jszip'
import { JSDOM } from 'jsdom'
import katex from 'katex'
import omml2mathml from 'omml2mathml'
import { MathMLToLaTeX } from 'mathml-to-latex'

const M_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
const W_NS_FALLBACK =
    'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

/**
 * Prefix used to mark equations smuggled through mammoth as plain text.
 * Base64-encoded so cleanText()/entity handling downstream can't mangle
 * the LaTeX before renderMathMarkers() gets to it.
 */
const MATH_MARKER_RE = /@@MATH:([A-Za-z0-9+/=]+)@@/g

type MathPayload = { latex: string; display: boolean }

function encodeMarker(payload: MathPayload): string {
    const json = JSON.stringify(payload)
    const b64 = Buffer.from(json, 'utf8').toString('base64')
    return `@@MATH:${b64}@@`
}

/**
 * Join the text of every m:t run under a math node - used as a fallback
 * when OMML->MathML->LaTeX conversion fails for a single equation, so a
 * bad equation degrades to its plain text instead of 500ing the article.
 */
function plainTextOf(node: Element): string {
    const texts = node.getElementsByTagNameNS(M_NS, 't')
    let out = ''
    for (let i = 0; i < texts.length; i++) {
        out += texts[i].textContent || ''
    }
    return out
}

/**
 * Convert a docx's embedded Word equations (OMML, `m:oMath` / `m:oMathPara`)
 * into inline text markers mammoth will carry through untouched, since
 * mammoth otherwise silently drops `m:oMath` elements. Markers are later
 * expanded to KaTeX HTML by renderMathMarkers() once mammoth has produced
 * the article HTML.
 */
export async function preprocessDocxMath(buffer: Buffer): Promise<Buffer> {
    const zip = await JSZip.loadAsync(buffer)
    const documentXmlFile = zip.file('word/document.xml')
    if (!documentXmlFile) {
        return buffer
    }

    const xml = await documentXmlFile.async('string')
    if (!xml.includes('<m:oMath')) {
        return buffer
    }

    const dom = new JSDOM(xml, { contentType: 'text/xml' })
    const doc = dom.window.document

    const wNamespace =
        doc.documentElement?.namespaceURI &&
        doc.documentElement.namespaceURI.includes('wordprocessingml')
            ? doc.documentElement.namespaceURI
            : W_NS_FALLBACK

    const replaceWithMarkerRun = (node: Element, payload: MathPayload) => {
        const run = doc.createElementNS(wNamespace, 'w:r')
        const text = doc.createElementNS(wNamespace, 'w:t')
        text.setAttribute('xml:space', 'preserve')
        text.textContent = encodeMarker(payload)
        run.appendChild(text)
        node.parentNode?.replaceChild(run, node)
    }

    const replaceWithPlainTextRun = (node: Element) => {
        const run = doc.createElementNS(wNamespace, 'w:r')
        const text = doc.createElementNS(wNamespace, 'w:t')
        text.setAttribute('xml:space', 'preserve')
        text.textContent = plainTextOf(node)
        run.appendChild(text)
        node.parentNode?.replaceChild(run, node)
    }

    const convertNode = (node: Element, display: boolean) => {
        try {
            const mathmlEl = omml2mathml(node)
            const latex = MathMLToLaTeX.convert(mathmlEl.outerHTML)
            replaceWithMarkerRun(node, { latex, display })
        } catch {
            // A single bad equation must never fail the whole article.
            replaceWithPlainTextRun(node)
        }
    }

    // m:oMathPara wraps a display-mode m:oMath. Handle these first and
    // whole, so the inner m:oMath is consumed with it rather than being
    // separately matched by the bare-oMath pass below.
    const mathParas = Array.from(
        doc.getElementsByTagNameNS(M_NS, 'oMathPara')
    )
    for (const node of mathParas) {
        convertNode(node, true)
    }

    // Remaining bare m:oMath elements are inline (non-display) equations.
    const bareMath = Array.from(doc.getElementsByTagNameNS(M_NS, 'oMath'))
    for (const node of bareMath) {
        convertNode(node, false)
    }

    const serialized = new dom.window.XMLSerializer().serializeToString(doc)
    zip.file('word/document.xml', serialized)
    return zip.generateAsync({ type: 'nodebuffer' })
}

/**
 * Expand every @@MATH:<base64>@@ marker left by preprocessDocxMath() into
 * rendered KaTeX HTML. Malformed markers (bad base64/JSON) are left as-is
 * rather than throwing.
 */
export function renderMathMarkers(html: string): string {
    return html.replace(MATH_MARKER_RE, (fullMatch, b64: string) => {
        try {
            const json = Buffer.from(b64, 'base64').toString('utf8')
            const payload = JSON.parse(json) as MathPayload
            return katex.renderToString(payload.latex, {
                throwOnError: false,
                displayMode: !!payload.display,
            })
        } catch {
            return fullMatch
        }
    })
}
