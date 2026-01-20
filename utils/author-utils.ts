/**
 * Generate URL-safe slug from author name and ID
 * Format: "john-smith-abc123"
 */
export function generateAuthorSlug(name: string, id: string): string {
    const nameSlug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
    const shortId = id.substring(0, 6)
    return `${nameSlug}-${shortId}`
}

/**
 * Extract original ID from slug
 * Used when querying by slug to get full ID for verification
 */
export function extractIdFromSlug(slug: string): string {
    const parts = slug.split('-')
    return parts[parts.length - 1]
}
