'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchIssues, fetchArticles, Issue, Article } from '@/utils/api-client';
import styles from '@/components/admin/Admin.module.scss';

export default function AdminDashboard() {
    const [issueCount, setIssueCount] = useState(0);
    const [articleCount, setArticleCount] = useState(0);
    const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
    const [recentArticles, setRecentArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);

        const [issuesResult, articlesResult] = await Promise.all([
            fetchIssues(),
            fetchArticles(),
        ]);

        if (issuesResult.data) {
            setIssueCount(issuesResult.data.length);
            setRecentIssues(issuesResult.data.slice(0, 5));
        }

        if (articlesResult.data) {
            setArticleCount(articlesResult.data.length);
            setRecentArticles(articlesResult.data.slice(0, 5));
        }

        setLoading(false);
    };

    if (loading) {
        return <div className={styles.loading}>Loading dashboard...</div>;
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Admin Dashboard</h1>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Total Issues</h3>
                    <div className={styles.statValue}>{issueCount}</div>
                </div>
                <div className={styles.statCard}>
                    <h3>Total Articles</h3>
                    <div className={styles.statValue}>{articleCount}</div>
                </div>
            </div>

            <div className={styles.quickActions}>
                <h2>Quick Actions</h2>
                <div className={styles.actionList}>
                    <Link href="/admin/issues/new" className={styles.btnPrimary}>
                        Create New Issue
                    </Link>
                    <Link href="/admin/articles/new" className={styles.btnPrimary}>
                        Create New Article
                    </Link>
                </div>
            </div>

            <div className={styles.recentItems}>
                <h2>Recent Issues</h2>
                {recentIssues.length > 0 ? (
                    <div className={styles.itemList}>
                        {recentIssues.map((issue) => (
                            <div key={issue.id} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <h4>Issue {issue.number}: {issue.title}</h4>
                                    <p>{new Date(issue.date).toLocaleDateString()} • {issue.published ? 'Published' : 'Unpublished'}</p>
                                </div>
                                <Link href={`/admin/issues/${issue.id}/edit`} className={styles.btnEdit}>
                                    Edit
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h3>No issues yet</h3>
                        <Link href="/admin/issues/new" className={styles.btnPrimary}>
                            Create Your First Issue
                        </Link>
                    </div>
                )}
            </div>

            <div className={styles.recentItems} style={{ marginTop: '2rem' }}>
                <h2>Recent Articles</h2>
                {recentArticles.length > 0 ? (
                    <div className={styles.itemList}>
                        {recentArticles.map((article) => (
                            <div key={article.id} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <h4>{article.title}</h4>
                                    <p>by {article.author} • {article.published ? 'Published' : 'Unpublished'}</p>
                                </div>
                                <Link href={`/admin/articles/${article.id}/edit`} className={styles.btnEdit}>
                                    Edit
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h3>No articles yet</h3>
                        <Link href="/admin/articles/new" className={styles.btnPrimary}>
                            Create Your First Article
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
