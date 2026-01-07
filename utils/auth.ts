import { jwtVerify } from 'jose'

export async function verifyAuth(token: string | undefined): Promise<boolean> {
    if (!token) {
        return false
    }

    const sessionSecret = process.env.SESSION_SECRET
    if (!sessionSecret) {
        console.error('SESSION_SECRET not configured')
        return false
    }

    try {
        const secret = new TextEncoder().encode(sessionSecret)
        await jwtVerify(token, secret)
        return true
    } catch (error) {
        return false
    }
}
