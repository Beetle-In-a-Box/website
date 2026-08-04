import type { PrismaClient } from '@prisma/client'

/**
 * Generate URL-safe slug from author name and ID.
 * Format: "john-smith-x7k2p9"
 *
 * The id suffix exists to disambiguate two authors who share a name (Author.name
 * is deliberately not unique; Author.slug is). It is taken from the END of the id
 * because Prisma's cuid() begins with 'c' plus a base36 timestamp — two records
 * created seconds apart share their leading characters, so a prefix makes a
 * useless discriminator. The tail carries the random component.
 *
 * @param name  author's display name
 * @param id    the author's own id
 * @param chars how much of the id tail to use; widened on retry after a collision
 */
export function generateAuthorSlug(name: string, id: string, chars = 6): string {
    const nameSlug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
    const shortId = id.slice(-chars)
    return `${nameSlug}-${shortId}`
}

/**
 * Create an Author with a slug derived from its own real id.
 * Creates the author with a guaranteed-unique temporary slug, then updates
 * it to the final slug (generateAuthorSlug(name, <real id>)) in the same
 * transaction so a failure cannot leave a temporary slug behind.
 */
export async function createAuthorWithSlug(prisma: PrismaClient, name: string) {
    return prisma.$transaction(async (tx) => {
        const tempSlug = `pending-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
        const created = await tx.author.create({
            data: {
                name,
                slug: tempSlug,
            },
        })

        // Widen the id suffix until the slug is unique. Two authors sharing a
        // name is legitimate, so a collision must resolve rather than fail —
        // the full id is unique, so this always terminates.
        for (let chars = 6; chars <= created.id.length; chars += 4) {
            const slug = generateAuthorSlug(name, created.id, chars)
            const clash = await tx.author.findFirst({
                where: { slug, id: { not: created.id } },
                select: { id: true },
            })
            if (clash) continue
            return tx.author.update({
                where: { id: created.id },
                data: { slug },
            })
        }

        // Unreachable in practice: the full-length id makes the slug unique.
        throw new Error(`Could not generate a unique slug for author "${name}"`)
    })
}
