import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDatabase() {
    try {
        console.log('Clearing database...\n')

        // Delete all articles first (due to foreign key constraint)
        const deletedArticles = await prisma.article.deleteMany({})
        console.log(`✓ Deleted ${deletedArticles.count} articles`)

        // Delete all issues
        const deletedIssues = await prisma.issue.deleteMany({})
        console.log(`✓ Deleted ${deletedIssues.count} issues`)

        console.log('\n✅ Database cleared successfully!')
    } catch (error) {
        console.error('❌ Clear failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

clearDatabase()
