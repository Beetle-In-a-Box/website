import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname,
    },
    api: {
        bodyParser: {
            sizeLimit: '100mb',
        },
    },
}

export default nextConfig
