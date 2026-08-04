import { readFileSync } from 'fs'
import { join } from 'path'

const SEED_IMAGES_PATH = join(process.cwd(), 'scripts', 'seed-images')
const SEED_DOCX_PATH = join(process.cwd(), 'scripts', 'seed-docx')
const API_BASE_URL = 'http://localhost:3000/api'

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
        fileName: 'ethics-artificial',
        title: 'The Ethics of Artificial Intelligence: Can Machines Be Moral Agents?',
        author: 'Jordan Chen',
        imageFileName: 'life-simulators_cover.png',
        number: 1,
    },
    {
        fileName: 'meaning-absurd',
        title: 'Finding Meaning in an Absurd World',
        author: 'Sarah Martinez',
        imageFileName: 'only-thing_cover.jpeg',
        number: 2,
    },
    {
        fileName: 'free-will',
        title: 'The Illusion of Free Will: A Neuroscientific Perspective',
        author: 'Alex Thompson',
        imageFileName: 'convenience-illusion_cover.png',
        number: 3,
    },
    {
        fileName: 'identity-persistence',
        title: 'Personal Identity and the Ship of Theseus',
        author: 'Morgan Lee',
        imageFileName: 'making-beauty_cover.jpeg',
        number: 4,
    },
    {
        fileName: 'moral-relativism',
        title: 'Against Moral Relativism: In Defense of Objective Values',
        author: 'Riley Park',
        imageFileName: 'does-liberalism_cover.png',
        number: 5,
    },
    {
        fileName: 'consciousness-problem',
        title: 'The Hard Problem of Consciousness: Why Experience Matters',
        author: 'Casey Williams',
        imageFileName: 'gossiping-tweens_cover.png',
        number: 6,
    },
]

async function login() {
    console.log('Logging in...')

    const password = process.env.ADMIN_PASSWORD
    if (!password) {
        throw new Error('ADMIN_PASSWORD environment variable not set')
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
    console.log('Creating Issue 2 via API...')

    const formData = new FormData()
    formData.append('title', 'Issue 2')
    formData.append('number', '2')
    formData.append('date', 'January 2026')
    formData.append('published', 'true')

    // Add issue cover image (reusing our-obsession cover for variety)
    const issueImagePath = join(SEED_IMAGES_PATH, 'our-obsession_cover.png')
    const issueImageBuffer = readFileSync(issueImagePath)
    const issueImageBlob = new Blob([issueImageBuffer], { type: 'image/png' })
    formData.append('image', issueImageBlob, 'issue-2_cover.png')

    const response = await fetch(`${API_BASE_URL}/issues`, {
        method: 'POST',
        headers: authCookie ? { Cookie: authCookie } : {},
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`Failed to create issue: ${await response.text()}`)
    }

    const issue = await response.json()
    console.log(`✓ Issue 2 created: ${issue.id}\n`)
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
        console.log('Starting database seed for Issue 2...\n')
        console.log('NOTE: Make sure the dev server is running on http://localhost:3000\n')

        // Step 0: Login first
        await login()

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
