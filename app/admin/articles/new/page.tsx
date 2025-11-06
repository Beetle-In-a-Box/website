'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createArticle, fetchIssues, Issue } from '@/utils/api-client'
import FileInput from '@/components/admin/FileInput'
import FormMessage from '@/components/admin/FormMessage'
import styles from '@/components/admin/Admin.module.scss'

function NewArticleForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [issues, setIssues] = useState<Issue[]>([])
    const [formData, setFormData] = useState({
        issueId: '',
        title: '',
        shortTitle: '',
        author: '',
        number: '',
        published: false,
    })
    const [contentFile, setContentFile] = useState<File | null>(null)
    const [previewFile, setPreviewFile] = useState<File | null>(null)
    const [citationsFile, setCitationsFile] = useState<File | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [message, setMessage] = useState<{
        type: 'success' | 'error'
        text: string
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadIssues()
    }, [])

    useEffect(() => {
        // Pre-select issue from URL parameter
        const issueIdFromUrl = searchParams.get('issueId')
        if (issueIdFromUrl && formData.issueId === '') {
            setFormData(prev => ({ ...prev, issueId: issueIdFromUrl }))
        }
    }, [searchParams, issues])

    const loadIssues = async () => {
        const result = await fetchIssues()
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else if (result.data) {
            setIssues(result.data)
        }
        setLoading(false)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        if (!contentFile) {
            setMessage({ type: 'error', text: 'Content file is required' })
            return
        }

        if (!previewFile) {
            setMessage({ type: 'error', text: 'Preview file is required' })
            return
        }

        setSubmitting(true)
        setMessage(null)

        const data = new FormData()
        data.append('issueId', formData.issueId)
        data.append('title', formData.title)
        if (formData.shortTitle) data.append('shortTitle', formData.shortTitle)
        data.append('author', formData.author)
        data.append('number', formData.number)
        data.append('published', String(formData.published))
        data.append('content', contentFile)
        data.append('preview', previewFile)

        if (citationsFile) {
            data.append('citations', citationsFile)
        }

        if (imageFile) {
            data.append('image', imageFile)
        }

        const result = await createArticle(data)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
            setSubmitting(false)
        } else {
            setMessage({
                type: 'success',
                text: 'Article created successfully!',
            })
            setTimeout(() => {
                router.push('/admin/articles')
            }, 1500)
        }
    }

    if (loading) {
        return <div className={styles.loading}>Loading...</div>
    }

    if (issues.length === 0) {
        return (
            <div>
                <div className={styles.pageHeader}>
                    <h1>Create New Article</h1>
                </div>
                <div className={styles.emptyState}>
                    <h3>No issues available</h3>
                    <p>
                        You need to create an issue before you can create
                        articles.
                    </p>
                    <a href="/admin/issues/new" className={styles.btnPrimary}>
                        Create New Issue
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Create New Article</h1>
            </div>

            {message && (
                <FormMessage
                    type={message.type}
                    message={message.text}
                    onClose={() => setMessage(null)}
                />
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="issueId">
                        Issue<span className={styles.required}>*</span>
                    </label>
                    <select
                        id="issueId"
                        value={formData.issueId}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                issueId: e.target.value,
                            })
                        }
                        required
                    >
                        <option value="">Select an issue</option>
                        {issues.map(issue => (
                            <option key={issue.id} value={issue.id}>
                                Issue {issue.number}: {issue.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="title">
                        Title<span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={e =>
                            setFormData({ ...formData, title: e.target.value })
                        }
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="shortTitle">Short Title</label>
                    <input
                        type="text"
                        id="shortTitle"
                        value={formData.shortTitle}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                shortTitle: e.target.value,
                            })
                        }
                    />
                    <p className={styles.helperText}>
                        Optional shorter version of the title for navigation
                    </p>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="author">
                        Author<span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="author"
                        value={formData.author}
                        onChange={e =>
                            setFormData({ ...formData, author: e.target.value })
                        }
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="number">
                        Article Number<span className={styles.required}>*</span>
                    </label>
                    <input
                        type="number"
                        id="number"
                        value={formData.number}
                        onChange={e =>
                            setFormData({ ...formData, number: e.target.value })
                        }
                        required
                        min="1"
                    />
                    <p className={styles.helperText}>
                        The order of this article within the issue
                    </p>
                </div>

                <FileInput
                    label="Content File"
                    name="content"
                    accept=".docx"
                    required
                    onChange={setContentFile}
                    selectedFileName={contentFile?.name}
                    helperText="Upload the article content as a .docx file (required)"
                />

                <FileInput
                    label="Preview File"
                    name="preview"
                    accept=".docx"
                    required
                    onChange={setPreviewFile}
                    selectedFileName={previewFile?.name}
                    helperText="Upload the article preview/excerpt as a .docx file (required)"
                />

                <FileInput
                    label="Citations File"
                    name="citations"
                    accept=".docx"
                    onChange={setCitationsFile}
                    selectedFileName={citationsFile?.name}
                    helperText="Upload the citations/footnotes as a .docx file (optional)"
                />

                <FileInput
                    label="Article Image"
                    name="image"
                    accept="image/*"
                    onChange={setImageFile}
                    selectedFileName={imageFile?.name}
                    helperText="Upload an image for this article (optional)"
                />

                <div className={styles.formGroup}>
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.published}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    published: e.target.checked,
                                })
                            }
                        />
                        Published
                    </label>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="submit"
                        className={styles.btnPrimary}
                        disabled={submitting}
                    >
                        {submitting ? 'Creating...' : 'Create Article'}
                    </button>
                    <button
                        type="button"
                        className={styles.btn}
                        onClick={() => router.push('/admin/articles')}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}

export default function NewArticlePage() {
    return (
        <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
            <NewArticleForm />
        </Suspense>
    )
}
