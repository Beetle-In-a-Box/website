import { readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/utils/prisma'
import { convertPreviewDocx } from '@/utils/docx-utils'

/**
 * Re-extracts previewText for every Article from its source .docx.
 *
 * previewText is extracted at upload time and persisted, so articles
 * uploaded before a cleanText fix (e.g. the em/en dash downgrade) keep
 * stale preview text even after the extraction logic is corrected.
 * Article bodies are converted at render time and heal automatically;
 * previews do not, hence this backfill script.
 */
async function refreshPreviews() {
    const articles = await prisma.article.findMany({
        select: {
            id: true,
            title: true,
            contentDocxPath: true,
            previewText: true,
        },
    })

    let changed = 0
    let unchanged = 0

    for (const article of articles) {
        const relativePath = article.contentDocxPath.replace(/^\/?/, '')
        const docxPath = join(process.cwd(), 'uploads', relativePath)

        let buffer: Buffer
        try {
            buffer = readFileSync(docxPath)
        } catch (error) {
            console.log(
                `SKIP "${article.title}" (${article.id}): could not read ${docxPath} - ${
                    error instanceof Error ? error.message : String(error)
                }`
            )
            continue
        }

        const newPreviewText = await convertPreviewDocx(buffer)

        if (newPreviewText === article.previewText) {
            unchanged++
            console.log(`UNCHANGED "${article.title}" (${article.id})`)
            continue
        }

        await prisma.article.update({
            where: { id: article.id },
            data: { previewText: newPreviewText },
        })

        changed++
        console.log(`CHANGED "${article.title}" (${article.id})`)
        console.log(`  old: ${article.previewText.slice(0, 120)}`)
        console.log(`  new: ${newPreviewText.slice(0, 120)}`)
    }

    console.log(
        `\nDone. ${changed} changed, ${unchanged} unchanged, ${articles.length} total.`
    )
}

refreshPreviews()
    .catch(error => {
        console.error('Failed to refresh previews:', error)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
