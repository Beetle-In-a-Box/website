'use client'

import { useState } from 'react'

interface PdfDownloadButtonProps {
    pdfUrl: string
}

export default function PdfDownloadButton({ pdfUrl }: PdfDownloadButtonProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div style={{ marginBottom: '2rem' }}>
            <a
                href={pdfUrl}
                download
                style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    fontFamily: "'Lora', serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: isHovered ? 'white' : '#1a1a1a',
                    backgroundColor: isHovered ? '#1a1a1a' : 'transparent',
                    border: '1px solid #1a1a1a',
                    borderRadius: '2px',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                Download PDF
            </a>
        </div>
    )
}
