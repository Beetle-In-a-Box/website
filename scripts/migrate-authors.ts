import { prisma } from '@/utils/prisma'
import { createAuthorWithSlug } from '@/utils/author-utils'

async function migrateAuthors() {
    console.log('Starting author migration...')

    try {
        // Get all articles (both old format with author string and new format)
        const articles = await prisma.article.findMany({
            select: {
                id: true,
                author: true,
                authorId: true,
            },
        })

        // Group articles by author name to avoid creating duplicates
        const authorMap = new Map<string, string>() // author name -> author id

        // First pass: create Author records for each unique author string
        const uniqueAuthors = new Set<string>()
        for (const article of articles) {
            // Skip if already has authorId
            if (article.authorId) {
                continue
            }

            // If author is an object (shouldn't happen in raw data, but check)
            if (typeof article.author === 'object') {
                continue
            }

            // author should be a string or null
            const authorName =
                typeof article.author === 'string' ? article.author : null
            if (authorName && !uniqueAuthors.has(authorName)) {
                uniqueAuthors.add(authorName)
            }
        }

        console.log(
            `Found ${uniqueAuthors.size} unique authors to migrate from string format`
        )

        // Create Author records
        for (const authorName of uniqueAuthors) {
            try {
                const author = await createAuthorWithSlug(prisma, authorName)
                authorMap.set(authorName, author.id)
                console.log(`Created author: ${authorName} (id: ${author.id})`)
            } catch (error) {
                // Author might already exist (from previous migration attempt)
                if ((error as { code?: string }).code === 'P2002') {
                    const existing = await prisma.author.findFirst({
                        where: { name: authorName },
                    })
                    if (existing) {
                        authorMap.set(authorName, existing.id)
                        console.log(
                            `Author already exists: ${authorName} (id: ${existing.id})`
                        )
                    }
                } else {
                    console.error(`Error creating author ${authorName}:`, error)
                    throw error
                }
            }
        }

        // Second pass: update articles to reference Author records
        let updatedCount = 0
        for (const article of articles) {
            if (article.authorId) {
                // Already migrated
                continue
            }

            const authorName =
                typeof article.author === 'string' ? article.author : null
            if (!authorName) {
                // No author string, skip
                continue
            }

            const authorId = authorMap.get(authorName)
            if (!authorId) {
                console.warn(
                    `Could not find author ID for article ${article.id} (author: ${authorName})`
                )
                continue
            }

            try {
                await prisma.article.update({
                    where: { id: article.id },
                    data: { authorId },
                })
                updatedCount++
            } catch (error) {
                console.error(
                    `Error updating article ${article.id}:`,
                    error
                )
                throw error
            }
        }

        console.log(
            `\nMigration complete!`
        )
        console.log(
            `- Created ${uniqueAuthors.size} new authors`
        )
        console.log(
            `- Updated ${updatedCount} articles to reference authors`
        )
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

migrateAuthors()
