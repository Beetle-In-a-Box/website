import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Beetle in a Box | UC Berkeley Undergraduate Philosophy Review',
    description: "UC Berkeley's undergraduate philosophy review publication",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
