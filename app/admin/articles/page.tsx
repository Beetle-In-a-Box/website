'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'
import Link from 'next/link'
import {
    fetchArticles,
    fetchIssues,
    deleteArticle,
    updateArticle,
    Article,
    Issue,
} from '@/utils/api-client'
import ArticleCard from '@/components/admin/ArticleCard'
import styles from '../Admin.module.scss'

function ArticlesContent() {
    const searchParams = useSearchParams()
    const [articles, setArticles] = useState<Article[]>([])
    const [issues, setIssues] = useState<Issue[]>([])
    const [filterIssueId, setFilterIssueId] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Set filter from URL query parameter
        const issueIdFromUrl = searchParams.get('issueId')
        if (issueIdFromUrl) {
            setFilterIssueId(issueIdFromUrl)
        }
        loadData()
    }, [searchParams])

    useEffect(() => {
        loadArticles()
    }, [filterIssueId])

    const loadData = async () => {
        setLoading(true)
        const issuesResult = await fetchIssues()
        if (issuesResult.data) {
            setIssues(issuesResult.data)
        }
        await loadArticles()
        setLoading(false)
    }

    const loadArticles = async () => {
        const result = await fetchArticles(filterIssueId || undefined)
        if (result.error) {
            toast.error(result.error)
        } else if (result.data) {
            setArticles(result.data)
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteArticle(id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Article deleted successfully')
            loadArticles()
        }
    }

    const handleTogglePublished = async (id: string, published: boolean) => {
        const formData = new FormData()
        formData.append('published', String(published))

        const result = await updateArticle(id, formData)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Article ${published ? 'published' : 'unpublished'} successfully`)
            loadArticles()
        }
    }

    if (loading) {
        return <div className={styles.loading}>Loading articles...</div>
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Articles</h1>
                <Link href="/admin/articles/new" className={styles.btnPrimary}>
                    Create New Article
                </Link>
            </div>

            <div className={styles.filterControls}>
                <label htmlFor="issueFilter">Filter by Issue:</label>
                <select
                    id="issueFilter"
                    value={filterIssueId}
                    onChange={e => setFilterIssueId(e.target.value)}
                >
                    <option value="">All Issues</option>
                    {issues.map(issue => (
                        <option key={issue.id} value={issue.id}>
                            Issue {issue.number}: {issue.title}
                        </option>
                    ))}
                </select>
            </div>

            {articles.length > 0 ? (
                <div className={styles.cardGrid}>
                    {articles.map(article => (
                        <ArticleCard
                            key={article.id}
                            article={article}
                            onDelete={handleDelete}
                            onTogglePublished={handleTogglePublished}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <h3>No articles found</h3>
                    <p>
                        {filterIssueId
                            ? 'No articles found for this issue.'
                            : 'Create your first article to get started.'}
                    </p>
                    <Link
                        href="/admin/articles/new"
                        className={styles.btnPrimary}
                    >
                        Create New Article
                    </Link>
                </div>
            )}
        </div>
    )
}

export default function ArticlesPage() {
    return (
        <Suspense
            fallback={<div className={styles.loading}>Loading articles...</div>}
        >
            <ArticlesContent />
        </Suspense>
    )
}
