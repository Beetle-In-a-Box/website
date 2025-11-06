import mammoth from 'mammoth'
import { unescapeHtml } from './text-utils'

/**
 * Convert .docx buffer to HTML content for article body
 * Processes paragraphs and adds footnote links
 */
export async function convertArticleDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.convertToHtml({ buffer })
        let html = result.value

        // Clean the text
        html = cleanText(html)

        // Process footnotes - add IDs and onclick handlers
        const footnoteCount = (html.match(/<sup>/g) || []).length
        for (let i = 1; i <= footnoteCount; i++) {
            html = html.replace(
                '<sup>',
                `<sup class='footnoteLink' id='fl${i}' onclick="goToElementWithHighlightModern('f${i}')">`,
            )
        }

        return html
    } catch (error) {
        throw new Error(
            `Failed to convert article .docx: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

/**
 * Convert .docx buffer to HTML for citations/footnotes
 * Each line becomes a clickable footnote
 */
export async function convertCitationsDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.convertToHtml({ buffer })
        let html = result.value

        // Clean the text
        html = cleanText(html)

        // Extract paragraphs and wrap them as footnotes
        const paragraphs = html
            .split(/<\/?p>/)
            .filter(p => p.trim().length > 0)
            .map(p => p.trim())

        let footnoteHtml = ''
        paragraphs.forEach((paragraph, index) => {
            const footnoteNumber = index + 1
            footnoteHtml += `<p class='text footnote' id='f${footnoteNumber}' onclick="goToElementWithHighlightModern('fl${footnoteNumber}')">${paragraph}</p>\n`
        })

        return footnoteHtml
    } catch (error) {
        throw new Error(
            `Failed to convert citations .docx: ${error instanceof Error ? error.message : String(error)}`,
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
        '\u2013': '-', // En dash
        '\u2014': '-', // Em dash
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
        return title.toLowerCase() + '.html'
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

    return fileName + '.html'
}
