import { prisma } from '@/utils/prisma'

/**
 * Fetches the date string of the latest published issue (highest issue number).
 * Returns undefined if no issue is found or an error occurs.
 */
export async function getLatestIssueDate() {
    try {
        const latestIssue = await prisma.issue.findFirst({
            where: { published: true },
            orderBy: { number: 'desc' },
            select: { date: true },
        })
        return latestIssue?.date || undefined
    } catch (error) {
        console.error('Error fetching latest issue:', error)
        return undefined
    }
}

/**
 * Fetches the number of the latest published issue.
 * Returns undefined if no issue is found or an error occurs.
 */
export async function getLatestIssueNumber() {
    try {
        const latestIssue = await prisma.issue.findFirst({
            where: { published: true },
            orderBy: { number: 'desc' },
            select: { number: true },
        })
        return latestIssue?.number
    } catch (error) {
        console.error('Error fetching latest issue number:', error)
        return undefined
    }
}
