/**
 * Unescape HTML entities
 */
export function unescapeHtml(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

/**
 * Truncate text to a maximum length and add ellipsis
 * Truncates at word boundaries to avoid cutting words in half
 */
export function truncateText(text: string, maxLength: number = 300): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  // If we found a space, truncate there; otherwise use maxLength
  const cutoff = lastSpace > 0 ? lastSpace : maxLength;

  return text.substring(0, cutoff).trim() + '...';
}
