import mammoth from 'mammoth'
import { unescapeHtml } from './text-utils'

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
        const result = await mammoth.convertToHtml({ buffer })
        let html = result.value

        // Clean the text
        html = cleanText(html)

        // Convert plain text URLs to clickable links
        html = autolinkUrls(html)

        // Split content from footnotes
        // Footnotes are paragraphs that start with <p><sup>NUMBER</sup>
        const paragraphs = html.split('</p>')
        const contentParagraphs: string[] = []
        const footnoteParagraphs: string[] = []
        let inFootnotesSection = false

        for (const para of paragraphs) {
            if (!para.trim()) continue

            // Check if this paragraph starts with a footnote (e.g., <p><sup>1</sup>)
            const footnoteMatch = para.match(/^<p><sup>(\d+)<\/sup>/)

            if (footnoteMatch) {
                inFootnotesSection = true
                // Extract footnote number and content
                const footnoteNum = footnoteMatch[1]
                const content = para.replace(/^<p><sup>\d+<\/sup>\s*/, '<p>')
                footnoteParagraphs.push({ num: footnoteNum, content } as any)
            } else if (!inFootnotesSection) {
                contentParagraphs.push(para + '</p>')
            }
        }

        // Process main content - add IDs and onclick to footnote reference links
        let mainContent = contentParagraphs.join('')
        let footnoteRefCount = 0
        mainContent = mainContent.replace(/<sup>/g, () => {
            footnoteRefCount++
            return `<sup class='footnoteLink' id='fl${footnoteRefCount}' onclick="goToElementWithHighlightModern('f${footnoteRefCount}')">`
        })

        // Process footnotes - format with proper structure
        let citationsHtml: string | null = null
        if (footnoteParagraphs.length > 0) {
            citationsHtml = footnoteParagraphs
                .map((footnote: any) => {
                    const { num, content } = footnote
                    // Format: <p class='footnote' id='f1' onclick='...'><sup>1</sup> Content</p>
                    const innerContent = content.replace('<p>', '').replace('</p>', '')
                    return `<p class='footnote' id='f${num}' onclick="goToElementWithHighlightModern('fl${num}')"><sup>${num}</sup> ${innerContent}</p>`
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
 * Convert .docx buffer to HTML for citations/footnotes
 * Each line becomes a clickable footnote
 */
export async function convertCitationsDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.convertToHtml({ buffer })
        let html = result.value

        // Clean the text
        html = cleanText(html)

        // Convert plain text URLs to clickable links
        html = autolinkUrls(html)

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
