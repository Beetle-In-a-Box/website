'use client';

import { Article } from '@/utils/api-client';
import Card from './Card';
import styles from './ArticleCard.module.scss';

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
        <Card
            editHref={`/admin/articles/${article.id}/edit`}
            onDelete={handleDelete}
            onTogglePublished={handleTogglePublished}
            published={article.published}
        >
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
        </Card>
    );
}
