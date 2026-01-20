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
 * Format an issue date string (e.g., "August 2025") to uppercase month + year
 * Expected format: "Month Year" (e.g., "August 2025", "January 2026")
 */
export function getSeasonFromIssueDate(dateString: string): string {
    const months: { [key: string]: string } = {
        'january': 'JANUARY', 'february': 'FEBRUARY', 'march': 'MARCH', 'april': 'APRIL',
        'may': 'MAY', 'june': 'JUNE', 'july': 'JULY', 'august': 'AUGUST',
        'september': 'SEPTEMBER', 'october': 'OCTOBER', 'november': 'NOVEMBER', 'december': 'DECEMBER',
    };

    const parts = dateString.trim().split(/\s+/);
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
}
