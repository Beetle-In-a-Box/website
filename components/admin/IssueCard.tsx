'use client'

import { Issue } from '@/utils/api-client'
import Card from './Card'
import styles from './IssueCard.module.scss'

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
        <Card
            editHref={`/admin/issues/${issue.id}/edit`}
            onDelete={handleDelete}
            onTogglePublished={handleTogglePublished}
            published={issue.published}
        >
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
        </Card>
    )
}
