'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import styles from '../Admin.module.scss'

interface Author {
    id: string
    name: string
    slug: string
    _count: { articles: number }
}

export default function AuthorsPage() {
    const [authors, setAuthors] = useState<Author[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAuthors()
    }, [])

    const loadAuthors = async () => {
        try {
            const response = await fetch('/api/authors')
            if (!response.ok) {
                toast.error('Failed to load authors')
                setLoading(false)
                return
            }
            const data = await response.json()
            setAuthors(data)
        } catch (error) {
            console.error('Error loading authors:', error)
            toast.error('Failed to load authors')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Delete author "${name}"?`)) {
            try {
                const response = await fetch(`/api/authors/${id}`, {
                    method: 'DELETE',
                })

                if (!response.ok) {
                    const error = await response.json()
                    toast.error(error.error || 'Failed to delete author')
                    return
                }

                toast.success('Author deleted')
                setAuthors(authors.filter(a => a.id !== id))
            } catch (error) {
                console.error('Error deleting author:', error)
                toast.error('Failed to delete author')
            }
        }
    }

    if (loading) {
        return <div className={styles.loading}>Loading authors...</div>
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Authors</h1>
                <Link href="/admin/authors/new" className={styles.btnPrimary}>
                    + New Author
                </Link>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Articles</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {authors.map(author => (
                        <tr key={author.id}>
                            <td>{author.name}</td>
                            <td>{author._count.articles}</td>
                            <td>
                                <Link href={`/admin/authors/${author.id}/edit`}>
                                    Edit
                                </Link>
                                <button
                                    onClick={() =>
                                        handleDelete(author.id, author.name)
                                    }
                                    className={styles.btnDanger}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
