'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { createArticle, fetchIssues, Issue } from '@/utils/api-client'
import FileInput from '@/components/admin/FileInput'
import styles from '../../Admin.module.scss'

function NewArticleForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [issues, setIssues] = useState<Issue[]>([])
    const [formData, setFormData] = useState({
        issueId: '',
        title: '',
        subtitle: '',
        shortTitle: '',
        author: '',
        imageArtist: '',
        number: '',
        previewText: '',
        published: false,
    })
    const [contentFile, setContentFile] = useState<File | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
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
            toast.error(result.error)
        } else if (result.data) {
            setIssues(result.data)
        }
        setLoading(false)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        if (!contentFile) {
            toast.error('Content file is required')
            return
        }

        setSubmitting(true)

        const data = new FormData()
        data.append('issueId', formData.issueId)
        data.append('title', formData.title)
        if (formData.subtitle) data.append('subtitle', formData.subtitle)
        if (formData.shortTitle) data.append('shortTitle', formData.shortTitle)
        data.append('author', formData.author)
        if (formData.imageArtist) data.append('imageArtist', formData.imageArtist)
        data.append('number', formData.number)
        if (formData.previewText) data.append('previewText', formData.previewText)
        data.append('published', String(formData.published))
        data.append('content', contentFile)

        if (imageFile) {
            data.append('image', imageFile)
        }

        const result = await createArticle(data)

        if (result.error) {
            toast.error(result.error)
            setSubmitting(false)
        } else {
            toast.success('Article created successfully!')
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
                    <label htmlFor="subtitle">Subtitle</label>
                    <input
                        type="text"
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                subtitle: e.target.value,
                            })
                        }
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
                    <label htmlFor="imageArtist">Image Artist</label>
                    <input
                        type="text"
                        id="imageArtist"
                        value={formData.imageArtist}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                imageArtist: e.target.value,
                            })
                        }
                    />
                    <p className={styles.helperText}>
                        Name of the artist who created the article image (optional)
                    </p>
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

                <div className={styles.formGroup}>
                    <label htmlFor="previewText">Preview Text</label>
                    <textarea
                        id="previewText"
                        value={formData.previewText}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                previewText: e.target.value,
                            })
                        }
                        rows={6}
                        placeholder="Leave blank to auto-extract from content file"
                        style={{ resize: 'none' }}
                    />
                    <p className={styles.helperText}>
                        Optional preview text for issue listing page. If left blank, will be automatically extracted from the content file.
                    </p>
                </div>

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
