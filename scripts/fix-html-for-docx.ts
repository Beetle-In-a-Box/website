/**
 * Utility to fix HTML structure before converting to .docx
 * Prevents html-to-docx from breaking inline formatting into separate paragraphs
 */

/**
 * Pre-process HTML to prevent formatting issues in html-to-docx conversion
 *
 * Issues fixed:
 * 1. Loose text with newlines gets broken into separate paragraphs
 * 2. Inline <i> and <em> tags get separated from surrounding text
 *
 * Solution: Normalize whitespace and wrap in <p> tags, while preserving spaces around inline elements
 */
export function fixHTMLForDocx(html: string): string {
    let fixed = html

    // Step 1: Normalize newlines to spaces, but preserve spaces around tags
    // Replace newlines with spaces
    fixed = fixed.replace(/\n/g, ' ')

    // Step 2: Normalize multiple spaces to single space
    fixed = fixed.replace(/\s{2,}/g, ' ')

    // Step 3: Ensure spaces around inline formatting tags (i, em, b, strong)
    // This prevents "word<i>italic</i>word" from becoming "worditalicword"
    // But don't add spaces before punctuation

    // Add space before opening tag only if preceded by alphanumeric (not already a space or punctuation)
    fixed = fixed.replace(/([a-zA-Z0-9])(<(?:i|em|b|strong|u|a)[^>]*>)/gi, '$1 $2')

    // Add space after closing tag only if followed by alphanumeric (not punctuation or space)
    fixed = fixed.replace(/(<\/(?:i|em|b|strong|u|a)>)([a-zA-Z0-9])/gi, '$1 $2')

    // Step 4: Clean up any double spaces we might have created
    fixed = fixed.replace(/\s{2,}/g, ' ')

    // Step 5: Ensure content is wrapped in <p> tags if it isn't already
    // Split by paragraph tags
    const lines = fixed.split(/(<\/?p[^>]*>)/gi)
    const wrapped: string[] = []
    let inParagraph = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Check if this is a <p> tag
        if (line.match(/<p[^>]*>/i)) {
            wrapped.push(line)
            inParagraph = true
        } else if (line.match(/<\/p>/i)) {
            wrapped.push(line)
            inParagraph = false
        } else if (line.trim()) {
            // This is content - wrap it if not already in a paragraph
            if (!inParagraph) {
                wrapped.push(`<p>${line.trim()}</p>`)
            } else {
                wrapped.push(line)
            }
        }
    }

    fixed = wrapped.join('')

    return fixed
}

/**
 * Alternative approach: Clean up the HTML more aggressively
 * This normalizes ALL whitespace while preserving structure
 */
export function normalizeHTMLWhitespace(html: string): string {
    let normalized = html

    // Remove newlines and excessive whitespace between tags and text
    // but preserve single spaces
    normalized = normalized.replace(/>\s+</g, '><') // Remove whitespace between tags
    normalized = normalized.replace(/>\s+/g, '> ') // Single space after tag
    normalized = normalized.replace(/\s+</g, ' <') // Single space before tag
    normalized = normalized.replace(/\s+/g, ' ') // Normalize all whitespace to single space

    return normalized.trim()
}

/**
 * Most reliable approach: Parse and reconstruct with proper structure
 */
export function restructureHTMLForDocx(html: string): string {
    // This is the safest approach - ensure everything is in proper <p> tags
    let restructured = html

    // First, normalize whitespace
    restructured = restructured.replace(/\s*\n\s*/g, ' ')
    restructured = restructured.replace(/\s+/g, ' ')

    // Then ensure content is wrapped
    // If there's no opening <p> tag at the start, wrap everything
    if (!restructured.trim().startsWith('<p')) {
        restructured = `<p>${restructured}</p>`
    }

    return restructured
}
