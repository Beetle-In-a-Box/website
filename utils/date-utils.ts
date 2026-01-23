/**
 * Get the current season and year as a formatted string
 * Spring: Before May 20th
 * Summer: May 20th - August 20th
 * Fall: After August 20th
 */
export function getSeasonAndYear(): string {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth returns 0-11
    const date = now.getDate();
    const year = now.getFullYear();

    let season: string;

    if (month < 5 || (month === 5 && date < 20)) {
        season = 'SPRING';
    } else if (month < 8 || (month === 8 && date < 20)) {
        season = 'SUMMER';
    } else {
        season = 'FALL';
    }

    return `${season} ${year}`;
}

/**
 * Get the current year
 */
export function getCurrentYear(): number {
    return new Date().getFullYear();
}

/**
 * Format a Date object or ISO string as "MONTH YEAR" (e.g., "JANUARY 2026")
 * This is the standard format for displaying issue dates across the site
 * Uses UTC to avoid timezone issues
 */
export function formatIssueDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const months = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    // Use UTC methods to avoid timezone conversion issues
    const month = months[dateObj.getUTCMonth()];
    const year = dateObj.getUTCFullYear();

    return `${month} ${year}`;
}

/**
 * Format an issue date string or Date object to uppercase month + year
 * For backwards compatibility - use formatIssueDate() for new code
 */
export function getSeasonFromIssueDate(date: string | Date): string {
    if (typeof date === 'string') {
        // Legacy string format: "August 2025"
        const months: { [key: string]: string } = {
            'january': 'JANUARY', 'february': 'FEBRUARY', 'march': 'MARCH', 'april': 'APRIL',
            'may': 'MAY', 'june': 'JUNE', 'july': 'JULY', 'august': 'AUGUST',
            'september': 'SEPTEMBER', 'october': 'OCTOBER', 'november': 'NOVEMBER', 'december': 'DECEMBER',
        };

        const parts = date.trim().split(/\s+/);
        const monthStr = parts[0]?.toLowerCase();
        const yearStr = parts[1];

        if (monthStr && yearStr && months[monthStr]) {
            const year = parseInt(yearStr, 10);
            if (!isNaN(year)) {
                return `${months[monthStr]} ${year}`;
            }
        }

        // Fallback to current season/year if parsing fails
        return getSeasonAndYear();
    } else {
        // Date object - use new formatter
        return formatIssueDate(date);
    }
}
