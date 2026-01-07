import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/utils/auth'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow login page and auth API routes
    if (pathname === '/admin/login' || pathname.startsWith('/api/auth/')) {
        return NextResponse.next()
    }

    // Check for authentication token
    const token = request.cookies.get('admin-token')?.value
    const isAuthenticated = await verifyAuth(token)

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        const loginUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/issues/:path*',
        '/api/articles/:path*',
    ],
}
