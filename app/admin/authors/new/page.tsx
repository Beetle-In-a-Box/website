'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import styles from '../../Admin.module.scss'

export default function NewAuthorPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const response = await fetch('/api/authors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.error || 'Failed to create author')
                setSubmitting(false)
                return
            }

            toast.success('Author created!')
            setTimeout(() => {
                router.push('/admin/authors')
            }, 1500)
        } catch (error) {
            console.error('Error creating author:', error)
            toast.error('Failed to create author')
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Create Author</h1>
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
                        {submitting ? 'Creating...' : 'Create Author'}
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
