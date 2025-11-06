'use client'

import Link from 'next/link'
import { Issue } from '@/utils/api-client'
import styles from './Admin.module.scss'

interface IssueCardProps {
    issue: Issue
    onDelete: (id: string) => void
    onTogglePublished: (id: string, published: boolean) => void
}

export default function IssueCard({
    issue,
    onDelete,
    onTogglePublished,
}: IssueCardProps) {
    const handleDelete = () => {
        if (
            confirm(
                `Are you sure you want to delete Issue ${issue.number}: ${issue.title}?`,
            )
        ) {
            onDelete(issue.id)
        }
    }

    const handleTogglePublished = () => {
        onTogglePublished(issue.id, !issue.published)
    }

    return (
        <div className={styles.card}>
            <div className={styles.cardContent}>
                {issue.imageUrl && (
                    <div className={styles.cardImage}>
                        <img src={issue.imageUrl} alt={issue.title} />
                    </div>
                )}
                <div className={styles.cardInfo}>
                    <h3>
                        Issue {issue.number}: {issue.title}
                    </h3>
                    <p className={styles.cardDate}>
                        {new Date(issue.date).toLocaleDateString()}
                    </p>
                    <p className={styles.cardMeta}>
                        <span
                            className={
                                issue.published
                                    ? styles.published
                                    : styles.unpublished
                            }
                        >
                            {issue.published ? 'Published' : 'Unpublished'}
                        </span>
                        {issue.articles && (
                            <span className={styles.articleCount}>
                                {issue.articles.length} article
                                {issue.articles.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>
            </div>
            <div className={styles.cardActions}>
                <Link
                    href={`/admin/articles?issueId=${issue.id}`}
                    className={styles.btnSecondary}
                >
                    View Articles ({issue.articles?.length || 0})
                </Link>
                <Link
                    href={`/admin/articles/new?issueId=${issue.id}`}
                    className={styles.btnPrimary}
                >
                    Add Article
                </Link>
                <Link
                    href={`/admin/issues/${issue.id}/edit`}
                    className={styles.btnEdit}
                >
                    Edit
                </Link>
                <button
                    onClick={handleTogglePublished}
                    className={styles.btnToggle}
                >
                    {issue.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={handleDelete} className={styles.btnDelete}>
                    Delete
                </button>
            </div>
        </div>
    )
}
