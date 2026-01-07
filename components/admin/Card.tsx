'use client'

import Link from 'next/link'
import styles from './Card.module.scss'

interface CardProps {
    children: React.ReactNode
    editHref: string
    onDelete: () => void
    onTogglePublished: () => void
    published: boolean
}

export default function Card({
    children,
    editHref,
    onDelete,
    onTogglePublished,
    published,
}: CardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.cardContent}>{children}</div>
            <div className={styles.cardActions}>
                <Link href={editHref} className={styles.btnEdit}>
                    Edit
                </Link>
                <button onClick={onTogglePublished} className={styles.btnToggle}>
                    {published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={onDelete} className={styles.btnDelete}>
                    Delete
                </button>
            </div>
        </div>
    )
}
