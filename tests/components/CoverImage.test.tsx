import { describe, it, expect, afterAll, beforeAll } from 'bun:test'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mkdir, writeFile, rm } from 'fs/promises'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import CoverImage from '@/components/ui/CoverImage'
import {
    imagesDir,
    variantsDir,
    VARIANT_WIDTHS,
    BLUR_WIDTH,
    BLUR_QUALITY,
} from '@/utils/image-variants'

const FIXTURE = 'test-fixture-cover-1234567890.png'

beforeAll(async () => {
    const sharp = (await import('sharp')).default
    await mkdir(imagesDir(), { recursive: true })
    const png = await sharp({
        create: {
            width: 1200,
            height: 800,
            channels: 3,
            background: { r: 90, g: 30, b: 140 },
        },
    })
        .png()
        .toBuffer()
    await writeFile(join(imagesDir(), FIXTURE), png)
})

afterAll(async () => {
    await rm(join(imagesDir(), FIXTURE), { force: true })
    for (const width of VARIANT_WIDTHS) {
        await rm(join(variantsDir(), `${FIXTURE}@${width}.webp`), { force: true })
    }
    await rm(join(variantsDir(), `${FIXTURE}@blur.txt`), { force: true })
})

describe('CoverImage', () => {
    it('emits a srcset covering every allowlisted width', async () => {
        const element = await CoverImage({
            src: `/images/${FIXTURE}`,
            alt: 'Cover art',
            sizes: '300px',
        })
        const { container } = render(element)
        const img = container.querySelector('img')!

        for (const width of VARIANT_WIDTHS) {
            expect(img.getAttribute('srcset')).toContain(
                `/images/${FIXTURE}?w=${width} ${width}w`,
            )
        }
    })

    it('lazy-loads by default and eager-loads when priority is set', async () => {
        const lazy = render(
            await CoverImage({
                src: `/images/${FIXTURE}`,
                alt: 'Cover art',
                sizes: '300px',
            }),
        )
        expect(lazy.container.querySelector('img')!.getAttribute('loading')).toBe(
            'lazy',
        )

        const eager = render(
            await CoverImage({
                src: `/images/${FIXTURE}`,
                alt: 'Cover art',
                sizes: '300px',
                priority: true,
            }),
        )
        expect(
            eager.container.querySelector('img')!.getAttribute('loading'),
        ).toBe('eager')
    })

    it('inlines a blur placeholder behind the image', async () => {
        const { container } = render(
            await CoverImage({
                src: `/images/${FIXTURE}`,
                alt: 'Cover art',
                sizes: '300px',
            }),
        )
        const wrapper = container.querySelector('[data-cover-wrapper]') as HTMLElement
        const backgroundImage = wrapper.style.backgroundImage

        expect(backgroundImage).toContain('data:image/webp;base64,')

        // The prefix check above proves *a* data URI was inlined, but would still
        // pass for a near-empty payload or the blur of some other image via a
        // cache-key collision. Pull out the base64 payload and check it for real.
        const base64Payload = backgroundImage
            .split('base64,')[1]
            .replace(/['")]+$/, '')
        const payloadBytes = Buffer.from(base64Payload, 'base64').length

        // The fixture is a flat solid colour with zero texture, so its 16px WebP
        // compresses unusually well (observed: 58 bytes) - nowhere near the
        // "roughly 300 bytes" a photographic blur runs, per the doc comment on
        // getBlurDataUrl. A floor of 20 still clears comfortably above a truly
        // empty/degenerate payload (a bare RIFF/WEBP container header alone is
        // already close to that), without assuming photographic content. Bound
        // the top too, since the whole point of the placeholder is staying small
        // enough to inline.
        expect(payloadBytes).toBeGreaterThan(20)
        expect(payloadBytes).toBeLessThan(2000)

        // Prove it is *this fixture's* blur, not a different image entirely, by
        // recomputing it directly with sharp using the exact width/quality the
        // service uses and comparing byte-for-byte. Test and service run against
        // the same sharp install in the same process, so this is deterministic.
        const sharp = (await import('sharp')).default
        const expectedBuffer = await sharp(join(imagesDir(), FIXTURE))
            .rotate()
            .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
            .webp({ quality: BLUR_QUALITY })
            .toBuffer()
        const expectedUri = `data:image/webp;base64,${expectedBuffer.toString('base64')}`

        expect(backgroundImage).toContain(expectedUri)
    })

    it('links to the untouched original when asked, opening a new tab', async () => {
        const { container } = render(
            await CoverImage({
                src: `/images/${FIXTURE}`,
                alt: 'Cover art',
                sizes: '300px',
                linkToFullRes: true,
                className: 'gridSlot',
            }),
        )
        const anchor = container.querySelector('a')!

        // No ?w= - the bare URL is the full-resolution original.
        expect(anchor.getAttribute('href')).toBe(`/images/${FIXTURE}`)
        expect(anchor.getAttribute('target')).toBe('_blank')
        expect(anchor.getAttribute('rel')).toContain('noopener')
        // className goes on the outermost element so grid placement still works.
        expect(anchor.className).toContain('gridSlot')
    })

    it('renders no link when linkToFullRes is not set', async () => {
        const { container } = render(
            await CoverImage({
                src: `/images/${FIXTURE}`,
                alt: 'Cover art',
                sizes: '300px',
            }),
        )

        expect(container.querySelector('a')).toBeNull()
    })

    it('renders the real image in the pre-hydration markup, not gated behind any client component', async () => {
        // renderToStaticMarkup mirrors exactly what the server sends before
        // any hydration runs - the same representation `curl` sees against a
        // production build, with no React event handlers or effects having
        // ever fired. Confirms the real image (not just the blur
        // placeholder) is part of that very first, non-hydrated paint - the
        // half of the requirement that "the blur must not stand in for the
        // image".
        const html = renderToStaticMarkup(
            await CoverImage({
                src: `/images/${FIXTURE}`,
                alt: 'Cover art',
                sizes: '300px',
            }),
        )

        const imgTag = html.match(/<img[^>]*>/)?.[0]
        expect(imgTag).toBeDefined()

        expect(imgTag).toContain(`src="/images/${FIXTURE}?w=800"`)
    })

    it('has no client component or opacity-0 default standing between render and visibility', () => {
        // This is the test that actually pins the fix: it fails against the
        // pre-fix source. (renderToStaticMarkup above can't do that job
        // itself - Bun's test runner doesn't resolve .module.scss into real
        // CSS Modules, so a rendered class name can't be checked against
        // computed opacity in this environment; this checks the source
        // directly instead, which no test-environment quirk can mask.)
        //
        // The original bug had two halves:
        // (1) CoverImage.tsx rendered a 'use client' FadingImage component
        //     that started `opacity: 0` and only became visible after a
        //     load event or a post-mount effect fired - neither of which
        //     runs without successful hydration.
        // (2) CoverImage.module.scss expressed that gate as
        //     `.image { opacity: 0 }` + `.loaded { opacity: 1 }`.
        // Assert neither half is back, however the component gets
        // refactored later.
        const componentSource = readFileSync(
            join(import.meta.dir, '../../components/ui/CoverImage.tsx'),
            'utf-8',
        )
        const scssSource = readFileSync(
            join(import.meta.dir, '../../components/ui/CoverImage.module.scss'),
            'utf-8',
        )

        expect(componentSource).not.toContain('FadingImage')
        expect(existsSync(join(import.meta.dir, '../../components/ui/FadingImage.tsx'))).toBe(
            false,
        )
        expect(scssSource).not.toMatch(/opacity:\s*0\b/)
        expect(scssSource).not.toContain('.loaded')
    })

    it('renders a public asset plainly, with no variants and no blur', async () => {
        const { container } = render(
            await CoverImage({
                src: '/default-article-cover.png',
                alt: 'Fallback',
                sizes: '300px',
            }),
        )
        const img = container.querySelector('img')!

        expect(img.getAttribute('src')).toBe('/default-article-cover.png')
        expect(img.getAttribute('srcset')).toBeNull()
    })
})
