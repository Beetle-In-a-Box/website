'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchIssues, deleteIssue, updateIssue, Issue } from '@/utils/api-client';
import IssueCard from '@/components/admin/IssueCard';
import FormMessage from '@/components/admin/FormMessage';
import styles from '@/components/admin/Admin.module.scss';

export default function IssuesPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadIssues();
    }, []);

    const loadIssues = async () => {
        setLoading(true);
        const result = await fetchIssues();

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else if (result.data) {
            setIssues(result.data);
        }

        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const result = await deleteIssue(id);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Issue deleted successfully' });
            loadIssues();
        }
    };

    const handleTogglePublished = async (id: string, published: boolean) => {
        const formData = new FormData();
        formData.append('published', String(published));

        const result = await updateIssue(id, formData);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: `Issue ${published ? 'published' : 'unpublished'} successfully` });
            loadIssues();
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading issues...</div>;
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Issues</h1>
                <Link href="/admin/issues/new" className={styles.btnPrimary}>
                    Create New Issue
                </Link>
            </div>

            {message && (
                <FormMessage
                    type={message.type}
                    message={message.text}
                    onClose={() => setMessage(null)}
                />
            )}

            {issues.length > 0 ? (
                <div className={styles.cardGrid}>
                    {issues.map((issue) => (
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                            onDelete={handleDelete}
                            onTogglePublished={handleTogglePublished}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <h3>No issues found</h3>
                    <p>Create your first issue to get started.</p>
                    <Link href="/admin/issues/new" className={styles.btnPrimary}>
                        Create New Issue
                    </Link>
                </div>
            )}
        </div>
    );
}
