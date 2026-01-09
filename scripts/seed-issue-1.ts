import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEED_IMAGES_PATH = join(process.cwd(), 'scripts', 'seed-images')
const SEED_DOCX_PATH = join(process.cwd(), 'scripts', 'seed-docx')
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'

let authCookie: string | null = null

interface ArticleData {
    fileName: string
    title: string
    author: string
    imageFileName: string
    number: number
}

const articles: ArticleData[] = [
    {
        fileName: 'making-beauty',
        title: 'Making Beauty In Ugly Things',
        author: 'Sichen Li',
        imageFileName: 'making-beauty_cover.jpeg',
        number: 1,
    },
    {
        fileName: 'convenience-illusion',
        title: 'The Convenience of Illusion: Are We Truly Committed to Reality?',
        author: 'Nicole Kadi',
        imageFileName: 'convenience-illusion_cover.png',
        number: 2,
    },
    {
        fileName: 'only-thing',
        title: 'The Only Thing We Fear Is You: How Chernobyl Turned Fear of The Unknown Into Fear of Ourselves',
        author: 'Deniz Durusoy',
        imageFileName: 'only-thing_cover.jpeg',
        number: 3,
    },
    {
        fileName: 'hyperreality-cultural',
        title: 'Hyperreality: A Cultural Analysis',
        author: 'Vienna Gaspar',
        imageFileName: 'life-simulators_cover.png',
        number: 4,
    },
    {
        fileName: 'does-liberalism',
        title: 'Does Liberalism Understand People?',
        author: 'Max Abubucker',
        imageFileName: 'does-liberalism_cover.png',
        number: 5,
    },
    {
        fileName: 'gossiping-tweens',
        title: 'Gossiping Tweens & Ending Regimes: The Promises & Pitfalls of the Doctrine of Double Effect',
        author: 'Karis Morasch',
        imageFileName: 'gossiping-tweens_cover.png',
        number: 6,
    },
]

async function login(password: string) {
    console.log('Logging in...')

    if (!password) {
        throw new Error('Password is required')
    }

    const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    })

    if (!response.ok) {
        throw new Error(`Login failed: ${await response.text()}`)
    }

    // Extract the cookie from the response
    const setCookie = response.headers.get('set-cookie')
    if (!setCookie) {
        throw new Error('No auth cookie received')
    }

    authCookie = setCookie
    console.log('✓ Logged in successfully\n')
}

async function createIssueViaAPI() {
    console.log('Creating Issue 1 via API...')

    const formData = new FormData()
    formData.append('title', 'Issue 1')
    formData.append('number', '1')
    formData.append('date', 'August 2025')
    formData.append('published', 'true')

    // Add issue cover image
    const issueImagePath = join(SEED_IMAGES_PATH, 'issue-1_cover.png')
    const issueImageBuffer = readFileSync(issueImagePath)
    const issueImageBlob = new Blob([issueImageBuffer], { type: 'image/png' })
    formData.append('image', issueImageBlob, 'issue-1_cover.png')

    const response = await fetch(`${API_BASE_URL}/issues`, {
        method: 'POST',
        headers: authCookie ? { Cookie: authCookie } : {},
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`Failed to create issue: ${await response.text()}`)
    }

    const issue = await response.json()
    console.log(`✓ Issue 1 created: ${issue.id}\n`)
    return issue
}

async function createArticleViaAPI(issueId: string, articleData: ArticleData) {
    console.log(`Creating article: ${articleData.title}...`)

    const formData = new FormData()
    formData.append('issueId', issueId)
    formData.append('title', articleData.title)
    formData.append('author', articleData.author)
    formData.append('number', articleData.number.toString())
    formData.append('published', 'true')

    // Load the .docx file
    const docxPath = join(SEED_DOCX_PATH, `${articleData.fileName}.docx`)
    const docxBuffer = readFileSync(docxPath)
    const docxBlob = new Blob([docxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
    formData.append('content', docxBlob, `${articleData.fileName}.docx`)

    // Add article cover image
    const imageExt = articleData.imageFileName.split('.').pop()
    const mimeType = imageExt === 'jpeg' ? 'image/jpeg' : 'image/png'
    const imagePath = join(SEED_IMAGES_PATH, articleData.imageFileName)
    const imageBuffer = readFileSync(imagePath)
    const imageBlob = new Blob([imageBuffer], { type: mimeType })
    formData.append('image', imageBlob, articleData.imageFileName)

    const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: authCookie ? { Cookie: authCookie } : {},
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`Failed to create article: ${await response.text()}`)
    }

    const article = await response.json()
    console.log(`✓ Article created: ${articleData.title}`)
    return article
}

async function seed() {
    try {
        console.log('Starting database seed for Issue 1...\n')
        console.log('NOTE: Make sure the dev server is running on http://localhost:3000\n')

        // Get password from command-line arguments
        const password = process.argv[2]
        if (!password) {
            console.error('❌ Error: Admin password is required')
            console.log('Usage: bun scripts/seed-issue-1.ts <admin-password>')
            process.exit(1)
        }

        // Step 0: Login first
        await login(password)

        // Step 1: Create the issue via API
        const issue = await createIssueViaAPI()

        // Step 2: Create all articles via API
        for (const articleData of articles) {
            await createArticleViaAPI(issue.id, articleData)
        }

        console.log('\n✅ Database seeded successfully!')
    } catch (error) {
        console.error('❌ Seed failed:', error)
        process.exit(1)
    }
}

seed()
