import type { NextConfig } from 'next'
import { join } from 'path'

const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname,
    },
    // Lets every CSS module reach the shared responsive breakpoints with a bare
    // `@use 'breakpoints'` instead of counting ../ segments from its own depth.
    sassOptions: {
        includePaths: [join(__dirname, 'styles')],
    },
    // No `images` block: nothing in this app uses next/image. Cover art and the
    // logo go through our own variant pipeline (see utils/image-variants.ts),
    // because the platform optimizer silently passes originals through on the
    // deploy host. The old remotePatterns entry existed solely to permit the
    // footer's OCF penguin, which is an SVG that next/image never optimized.
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
            {
                source: '/pdfs/:path*',
                destination: '/api/static/pdfs/:path*',
            },
        ]
    },
    async redirects() {
        return [
            {
                source: '/apply',
                destination: '/connect',
                permanent: true,
            },
        ]
    },
}

export default nextConfig
