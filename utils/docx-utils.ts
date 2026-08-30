import mammoth from 'mammoth'
import { unescapeHtml } from './text-utils'

// mammoth's published types don't declare `transforms`, though it exists at
// runtime. Cast narrowly at this boundary instead of `any`-ing the module.
type MammothParagraph = { alignment?: string; styleId?: string } & Record<
    string,
    unknown
>
const mammothTransforms = (
    mammoth as unknown as {
        transforms: {
            paragraph: (
                fn: (paragraph: MammothParagraph) => MammothParagraph
            ) => (element: unknown) => unknown
        }
    }
).transforms

/**
 * Convert plain text URLs to clickable links
 */
function autolinkUrls(html: string): string {
    // Match URLs starting with http:// or https://
    // Excludes trailing punctuation (periods, commas, etc.) that aren't part of the URL
    const urlRegex = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)]/g

    return html.replace(urlRegex, (url) => {
        return `<a href="${url}">${url}</a>`
    })
}

/**
 * Convert .docx buffer to HTML content for article body
 * Processes paragraphs and adds footnote links
 * Returns an object with separate content and citations
 */
export async function convertArticleDocx(buffer: Buffer): Promise<{
    content: string
    citations: string | null
}> {
    try {
        // Word/Google Docs express centering as paragraph alignment, which
        // mammoth ignores unless mapped. Tag centered paragraphs with a
        // synthetic style so the style map can emit p.centered.
        const centerParagraphs = mammothTransforms.paragraph(paragraph => {
            if (paragraph.alignment === 'center' && !paragraph.styleId) {
                return {
                    ...paragraph,
                    styleId: 'BeetleCentered',
                    styleName: 'BeetleCentered',
                }
            }
            return paragraph
        })

        const result = await mammoth.convertToHtml(
            { buffer },
            {
                transformDocument: centerParagraphs,
                styleMap: ["p[style-name='BeetleCentered'] => p.centered:fresh"],
            }
        )
        let html = result.value

        // Clean the text
        html = cleanText(html)

        // Convert plain text URLs to clickable links
        html = autolinkUrls(html)

        // Find where footnotes start
        // Footnotes in the HTML are paragraphs that start with either:
        // 1. <p><sup>NUMBER</sup> (Word/Google Docs footnotes)
        // 2. <p>[NUMBER] (manually typed endnotes)
        // They appear at the end of the content
        const footnotePattern = /(?:<p(?: class="centered")?>(?:<em>)?(?:‌\s*)?<sup>(\d+)<\/sup>)|(?:<p(?: class="centered")?>\[(\d+)\])/g
        const footnoteMatches = [...html.matchAll(footnotePattern)]

        let mainContent = html
        const footnotes: Array<{ index: number; html: string }> = []

        if (footnoteMatches.length > 0) {
            // Find the position of the first footnote (either format)
            const firstFootnoteMatch = html.match(/(?:<p(?: class="centered")?>(?:<em>)?(?:‌\s*)?<sup>(\d+)<\/sup>)|(?:<p(?: class="centered")?>\[(\d+)\])/)
            if (firstFootnoteMatch) {
                const firstFootnoteIndex = html.indexOf(firstFootnoteMatch[0])

                // Split into main content and footnotes
                mainContent = html.substring(0, firstFootnoteIndex)
                const footnotesHtml = html.substring(firstFootnoteIndex)

                // Extract all footnotes from the footnotes section (both formats)
                const footnoteRegex = /(?:<p(?: class="centered")?>(?:<em>)?(?:‌\s*)?<sup>(\d+)<\/sup>([\s\S]*?)<\/p>)|(?:<p(?: class="centered")?>\[(\d+)\]([\s\S]*?)<\/p>)/g
                let match
                while ((match = footnoteRegex.exec(footnotesHtml)) !== null) {
                    // Check which format matched
                    if (match[1]) {
                        // <sup> format
                        const [, index, content] = match
                        footnotes.push({
                            index: parseInt(index),
                            html: content,
                        })
                    } else if (match[3]) {
                        // [NUMBER] format
                        const [, , , index, content] = match
                        footnotes.push({
                            index: parseInt(index),
                            html: content,
                        })
                    }
                }
            }
        }

        // Process main content - add IDs and onclick to footnote reference links
        // Handle both <sup> tags (from Word footnotes) and [NUMBER] format
        let footnoteRefCount = 0

        // Check if we have <sup> tags in main content
        const hasSuperscript = /<sup>/g.test(mainContent)

        if (hasSuperscript) {
            // Replace <sup> tags (Word footnote references)
            mainContent = mainContent.replace(/<sup>/g, () => {
                footnoteRefCount++
                return `<sup class='footnoteLink' id='fl${footnoteRefCount}' onclick="goToElementWithHighlightModern('f${footnoteRefCount}')">`
            })
        } else {
            // Replace [NUMBER] references (manually typed endnote references)
            mainContent = mainContent.replace(/\[(\d+)\]/g, (match, num) => {
                footnoteRefCount++
                return `<sup class='footnoteLink' id='fl${footnoteRefCount}' onclick="goToElementWithHighlightModern('f${footnoteRefCount}')">[${num}]</sup>`
            })
        }

        // Process footnotes - format with proper structure
        let citationsHtml: string | null = null
        if (footnotes.length > 0) {
            citationsHtml = footnotes
                .sort((a, b) => a.index - b.index) // Ensure footnotes are in order
                .map((footnote) => {
                    const { index, html: content } = footnote
                    // Clean the footnote content
                    const cleanedContent = cleanText(content)
                        .replace(/<em>/g, '<i>')
                        .replace(/<\/em>/g, '</i>')
                        .replace(/<\/?p>/g, '')
                        .trim()
                    return `<p class='text footnote' id='f${index}' onclick="goToElementWithHighlightModern('fl${index}')"><sup>${index}</sup> ${cleanedContent}</p>`
                })
                .join('\n')
        }

        return { content: mainContent, citations: citationsHtml }
    } catch (error) {
        throw new Error(
            `Failed to convert article .docx: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

/**
 * Convert .docx buffer to plain text for preview
 */
export async function convertPreviewDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer })
        let text = result.value

        // Clean the text
        text = cleanText(text)

        // Remove extra whitespace and newlines
        text = text.replace(/\s+/g, ' ').trim()

        return text
    } catch (error) {
        throw new Error(
            `Failed to convert preview .docx: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

/**
 * Clean text by unescaping HTML entities and replacing special characters
 */
function cleanText(text: string): string {
    text = unescapeHtml(text)

    const replacements: Record<string, string> = {
        '\u201c': '"', // Left double quote
        '\u201d': '"', // Right double quote
        '\u2018': "'", // Left single quote
        '\u2019': "'", // Right single quote
        '\u2026': '...', // Ellipsis
        '\u2022': '*', // Bullet
        '\u00a0': ' ', // Non-breaking space
    }

    for (const [key, value] of Object.entries(replacements)) {
        text = text.replace(new RegExp(key, 'g'), value)
    }

    return text
}

/**
 * Generate URL-friendly filename from article title
 * Removes punctuation, common words, and uses first two words
 */
export function generateFileName(title: string): string {
    if (!title.includes(' ')) {
        return title.toLowerCase()
    }

    // Remove punctuation and convert to lowercase
    const cleanedTitle = title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim()

    // Split into words
    let words = cleanedTitle.split(/\s+/)

    // Remove common words
    const commonWords = [
        'a',
        'the',
        'of',
        'in',
        'on',
        'at',
        'to',
        'for',
        'and',
        'or',
    ]
    words = words.filter(word => !commonWords.includes(word))

    // Take first two words
    const fileName = words.slice(0, 2).join('-')

    return fileName
}
