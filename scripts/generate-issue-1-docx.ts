import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { JSDOM } from 'jsdom'
import HTMLtoDOCX from 'html-to-docx'
import { fixHTMLForDocx } from './fix-html-for-docx'

const BASE_PATH =
    '/Users/michaelslain/Documents/dev/beetle-in-a-box/BeetleInABox_Website'
const OUTPUT_PATH = join(process.cwd(), 'scripts', 'seed-docx')

interface ArticleData {
    fileName: string
    title: string
}

const articles: ArticleData[] = [
    {
        fileName: 'making-beauty',
        title: 'Making Beauty In Ugly Things',
    },
    {
        fileName: 'convenience-illusion',
        title: 'The Convenience of Illusion: Are We Truly Committed to Reality?',
    },
    {
        fileName: 'only-thing',
        title: 'The Only Thing We Fear Is You: How Chernobyl Turned Fear of The Unknown Into Fear of Ourselves',
    },
    {
        fileName: 'hyperreality-cultural',
        title: 'Hyperreality: A Cultural Analysis',
    },
    {
        fileName: 'does-liberalism',
        title: 'Does Liberalism Understand People?',
    },
    {
        fileName: 'gossiping-tweens',
        title: 'Gossiping Tweens & Ending Regimes: The Promises & Pitfalls of the Doctrine of Double Effect',
    },
]

function extractContentFromHTML(htmlPath: string): string {
    const html = readFileSync(htmlPath, 'utf-8')
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Find the main content container
    const contentDiv = document.querySelector('.text.contents')
    if (!contentDiv) {
        throw new Error(`Could not find content div in ${htmlPath}`)
    }

    // Extract content before the footnote border
    const footnoteBorder = contentDiv.querySelector('.footnoteBorder')

    let fullHtml = ''

    if (footnoteBorder) {
        // Get all nodes before the footnote border (article content)
        let node = contentDiv.firstChild
        while (node && node !== footnoteBorder) {
            if (node.nodeType === 1) {
                fullHtml += (node as Element).outerHTML
            } else if (node.nodeType === 3) {
                const text = node.textContent?.trim()
                if (text) fullHtml += text
            }
            node = node.nextSibling
        }

        // Add the border
        fullHtml += footnoteBorder.outerHTML

        // Get all footnotes after the border
        node = footnoteBorder.nextSibling
        while (node) {
            if (node.nodeType === 1) {
                fullHtml += (node as Element).outerHTML
            }
            node = node.nextSibling
        }
    } else {
        // No citations, all content
        fullHtml = contentDiv.innerHTML
    }

    return fullHtml.trim()
}

async function generateDocxFiles() {
    console.log('Generating .docx files from HTML articles...\n')

    // Create output directory
    if (!existsSync(OUTPUT_PATH)) {
        mkdirSync(OUTPUT_PATH, { recursive: true })
    }

    for (const article of articles) {
        console.log(`Processing: ${article.title}...`)

        // Extract HTML content
        const htmlPath = join(BASE_PATH, `Issue-1/${article.fileName}.html`)
        const htmlContent = extractContentFromHTML(htmlPath)

        // Fix HTML structure to prevent formatting issues
        const fixedHTML = fixHTMLForDocx(htmlContent)

        // Convert to .docx
        const docxBuffer = await HTMLtoDOCX(fixedHTML, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
        }) as unknown as Buffer

        // Save to file
        const outputFile = join(OUTPUT_PATH, `${article.fileName}.docx`)
        writeFileSync(outputFile, docxBuffer)

        console.log(`✓ Created: ${outputFile}`)
    }

    console.log('\n✅ All .docx files generated successfully!')
}

generateDocxFiles()
