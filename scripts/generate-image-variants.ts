/**
 * Generate derivatives for every image already on disk.
 *
 * Idempotent and safe to re-run: warmVariants skips anything already cached.
 * Intended to be run once on the deploy host after shipping the variant
 * service, so existing images stop being served at full resolution.
 *
 * Usage: bun run images:backfill
 */
import { readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'
import {
    imagesDir,
    variantsDir,
    warmVariants,
    VARIANT_WIDTHS,
} from '../utils/image-variants'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function main() {
    const dir = imagesDir()
    if (!existsSync(dir)) {
        console.error(`No images directory at ${dir}`)
        process.exit(1)
    }

    const entries = await readdir(dir)
    const images = entries.filter(name =>
        IMAGE_EXTENSIONS.has(extname(name).toLowerCase()),
    )

    if (images.length === 0) {
        console.log('No images found.')
        return
    }

    console.log(`Found ${images.length} image(s) in ${dir}\n`)

    let originalTotal = 0
    let displayTotal = 0
    let failures = 0

    for (const name of images) {
        const originalSize = (await stat(join(dir, name))).size
        originalTotal += originalSize

        await warmVariants(name)

        // The 800px derivative is what a typical visitor actually downloads.
        const displayPath = join(variantsDir(), `${name}@800.webp`)
        if (!existsSync(displayPath)) {
            failures += 1
            console.log(`  ${name}: FAILED (no derivative produced)`)
            continue
        }

        const displaySize = (await stat(displayPath)).size
        displayTotal += displaySize

        const saved = originalSize - displaySize
        const pct = originalSize > 0 ? Math.round((saved / originalSize) * 100) : 0
        console.log(
            `  ${name}: ${formatBytes(originalSize)} -> ${formatBytes(displaySize)} (${pct}% smaller)`,
        )
    }

    console.log(
        `\nTotal at 800px: ${formatBytes(originalTotal)} -> ${formatBytes(displayTotal)}`,
    )
    console.log(`Widths generated: ${VARIANT_WIDTHS.join(', ')}`)
    if (failures > 0) {
        console.log(
            `\n${failures} image(s) produced no derivative - sharp may be unavailable. Those will serve originals.`,
        )
    }
}

main().catch(error => {
    console.error('Backfill failed:', error)
    process.exit(1)
})
