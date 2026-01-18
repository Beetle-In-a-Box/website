import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'www.ocf.berkeley.edu',
            },
        ],
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
