import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname,
    },
    async rewrites() {
        return [
            {
                source: '/images/:path*',
                destination: '/api/static/images/:path*',
            },
            {
                source: '/articles/:path*',
                destination: '/api/static/articles/:path*',
            },
        ]
    },
}

export default nextConfig
