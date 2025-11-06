'use client';

import Link from 'next/link';
import { Article } from '@/utils/api-client';
import styles from './Admin.module.scss';

interface ArticleCardProps {
    article: Article;
    onDelete: (id: string) => void;
    onTogglePublished: (id: string, published: boolean) => void;
}

export default function ArticleCard({ article, onDelete, onTogglePublished }: ArticleCardProps) {
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${article.title}" by ${article.author}?`)) {
            onDelete(article.id);
        }
    };

    const handleTogglePublished = () => {
        onTogglePublished(article.id, !article.published);
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardContent}>
                {article.imageUrl && (
                    <div className={styles.cardImage}>
                        <img src={article.imageUrl} alt={article.title} />
                    </div>
                )}
                <div className={styles.cardInfo}>
                    <h3>{article.title}</h3>
                    <p className={styles.cardAuthor}>by {article.author}</p>
                    {article.issue && (
                        <p className={styles.cardIssue}>
                            Issue {article.issue.number}: {article.issue.title}
                        </p>
                    )}
                    <p className={styles.cardMeta}>
                        <span className={styles.articleNumber}>Article #{article.number}</span>
                        <span className={article.published ? styles.published : styles.unpublished}>
                            {article.published ? 'Published' : 'Unpublished'}
                        </span>
                    </p>
                </div>
            </div>
            <div className={styles.cardActions}>
                <Link href={`/admin/articles/${article.id}/edit`} className={styles.btnEdit}>
                    Edit
                </Link>
                <button
                    onClick={handleTogglePublished}
                    className={styles.btnToggle}
                >
                    {article.published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                    onClick={handleDelete}
                    className={styles.btnDelete}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
