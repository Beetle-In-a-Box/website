'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import styles from '../../../Admin.module.scss'

interface Author {
    id: string
    name: string
    slug: string
}

export default function EditAuthorPage() {
    const router = useRouter()
    const params = useParams()
    const authorId = params.id as string
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const loadAuthor = async () => {
            try {
                const response = await fetch(`/api/authors/${authorId}`)
                if (!response.ok) {
                    toast.error('Failed to load author')
                    router.push('/admin/authors')
                    return
                }
                const author: Author = await response.json()
                setName(author.name)
            } catch (error) {
                console.error('Error loading author:', error)
                toast.error('Failed to load author')
                router.push('/admin/authors')
            } finally {
                setLoading(false)
            }
        }

        loadAuthor()
    }, [authorId, router])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const response = await fetch(`/api/authors/${authorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.error || 'Failed to update author')
                setSubmitting(false)
                return
            }

            toast.success('Author updated!')
            setTimeout(() => {
                router.push('/admin/authors')
            }, 1500)
        } catch (error) {
            console.error('Error updating author:', error)
            toast.error('Failed to update author')
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className={styles.loading}>Loading author...</div>
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Edit Author</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="name">
                        Name<span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>

                <div className={styles.formActions}>
                    <button
                        type="submit"
                        className={styles.btnPrimary}
                        disabled={submitting}
                    >
                        {submitting ? 'Updating...' : 'Update Author'}
                    </button>
                    <button
                        type="button"
                        className={styles.btn}
                        onClick={() => router.push('/admin/authors')}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
