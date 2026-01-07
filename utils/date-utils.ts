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
