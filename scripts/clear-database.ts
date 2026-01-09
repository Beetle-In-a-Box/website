import { PrismaClient } from '@prisma/client'
import { readdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()

async function clearFiles() {
    const publicDir = join(process.cwd(), 'public')
    const imagesDir = join(publicDir, 'images')
    const articlesDir = join(publicDir, 'articles')

    let deletedCount = 0

    // Delete all images
    if (existsSync(imagesDir)) {
        const imageFiles = await readdir(imagesDir)
        for (const file of imageFiles) {
            await unlink(join(imagesDir, file))
            deletedCount++
        }
    }

    // Delete all .docx files
    if (existsSync(articlesDir)) {
        const articleFiles = await readdir(articlesDir)
        for (const file of articleFiles) {
            await unlink(join(articlesDir, file))
            deletedCount++
        }
    }

    return deletedCount
}

async function clearDatabase() {
    try {
        console.log('Clearing database and files...\n')

        // Get counts before deletion
        const articles = await prisma.article.findMany()
        const issues = await prisma.issue.findMany()

        // Delete all articles first (due to foreign key constraint)
        await prisma.article.deleteMany({})
        console.log(`✓ Deleted ${articles.length} articles from database`)

        // Delete all issues
        await prisma.issue.deleteMany({})
        console.log(`✓ Deleted ${issues.length} issues from database`)

        // Delete all files
        const deletedFiles = await clearFiles()
        console.log(`✓ Deleted ${deletedFiles} files from filesystem`)

        console.log('\n✅ Database and files cleared successfully!')
    } catch (error) {
        console.error('❌ Clear failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

clearDatabase()
