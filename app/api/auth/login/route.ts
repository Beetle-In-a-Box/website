import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { password } = body

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            )
        }

        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
        const sessionSecret = process.env.SESSION_SECRET

        console.log('Password hash from env:', adminPasswordHash)
        console.log('Hash length:', adminPasswordHash?.length)

        if (!adminPasswordHash || !sessionSecret) {
            console.error('Missing ADMIN_PASSWORD_HASH or SESSION_SECRET in .env')
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }

        // Verify password
        const isValid = await bcrypt.compare(password, adminPasswordHash)
        console.log('Password comparison result:', isValid)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            )
        }

        // Create JWT token
        const secret = new TextEncoder().encode(sessionSecret)
        const token = await new SignJWT({ admin: true })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(secret)

        // Set httpOnly cookie
        const response = NextResponse.json({ success: true })
        response.cookies.set('admin-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Failed to login' },
            { status: 500 }
        )
    }
}
