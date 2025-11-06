'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchArticle, updateArticle, fetchIssues, Issue } from '@/utils/api-client';
import FileInput from '@/components/admin/FileInput';
import FormMessage from '@/components/admin/FormMessage';
import styles from '@/components/admin/Admin.module.scss';

export default function EditArticlePage() {
    const router = useRouter();
    const params = useParams();
    const articleId = params.id as string;

    const [issues, setIssues] = useState<Issue[]>([]);
    const [formData, setFormData] = useState({
        issueId: '',
        title: '',
        shortTitle: '',
        author: '',
        number: '',
        published: false,
    });
    const [contentFile, setContentFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [citationsFile, setCitationsFile] = useState<File | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [articleId]);

    const loadData = async () => {
        const [articleResult, issuesResult] = await Promise.all([
            fetchArticle(articleId),
            fetchIssues(),
        ]);

        if (articleResult.error) {
            setMessage({ type: 'error', text: articleResult.error });
        } else if (articleResult.data) {
            const article = articleResult.data;
            setFormData({
                issueId: article.issueId,
                title: article.title,
                shortTitle: article.shortTitle || '',
                author: article.author,
                number: String(article.number),
                published: article.published,
            });
            setCurrentImageUrl(article.imageUrl);
        }

        if (issuesResult.data) {
            setIssues(issuesResult.data);
        }

        setLoading(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        const data = new FormData();
        data.append('issueId', formData.issueId);
        data.append('title', formData.title);
        if (formData.shortTitle) data.append('shortTitle', formData.shortTitle);
        data.append('author', formData.author);
        data.append('number', formData.number);
        data.append('published', String(formData.published));

        if (contentFile) {
            data.append('content', contentFile);
        }

        if (previewFile) {
            data.append('preview', previewFile);
        }

        if (citationsFile) {
            data.append('citations', citationsFile);
        }

        if (imageFile) {
            data.append('image', imageFile);
        }

        const result = await updateArticle(articleId, data);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
            setSubmitting(false);
        } else {
            setMessage({ type: 'success', text: 'Article updated successfully!' });
            setTimeout(() => {
                router.push('/admin/articles');
            }, 1500);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading article...</div>;
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Edit Article</h1>
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
                        onChange={(e) => setFormData({ ...formData, issueId: e.target.value })}
                        required
                    >
                        <option value="">Select an issue</option>
                        {issues.map((issue) => (
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
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="shortTitle">Short Title</label>
                    <input
                        type="text"
                        id="shortTitle"
                        value={formData.shortTitle}
                        onChange={(e) => setFormData({ ...formData, shortTitle: e.target.value })}
                    />
                    <p className={styles.helperText}>Optional shorter version of the title for navigation</p>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="author">
                        Author<span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        required
                        min="1"
                    />
                    <p className={styles.helperText}>The order of this article within the issue</p>
                </div>

                <FileInput
                    label="Content File"
                    name="content"
                    accept=".docx"
                    onChange={setContentFile}
                    selectedFileName={contentFile?.name}
                    helperText="Upload a new .docx file to replace the current content (leave empty to keep current)"
                />

                <FileInput
                    label="Preview File"
                    name="preview"
                    accept=".docx"
                    onChange={setPreviewFile}
                    selectedFileName={previewFile?.name}
                    helperText="Upload a new .docx file to replace the current preview (leave empty to keep current)"
                />

                <FileInput
                    label="Citations File"
                    name="citations"
                    accept=".docx"
                    onChange={setCitationsFile}
                    selectedFileName={citationsFile?.name}
                    helperText="Upload a new .docx file to replace the current citations (optional)"
                />

                {currentImageUrl && !imageFile && (
                    <div className={styles.formGroup}>
                        <label>Current Article Image</label>
                        <div style={{ marginTop: '0.5rem' }}>
                            <img
                                src={currentImageUrl}
                                alt="Current article image"
                                style={{ maxWidth: '200px', borderRadius: '4px' }}
                            />
                        </div>
                    </div>
                )}

                <FileInput
                    label={currentImageUrl ? "Replace Article Image" : "Article Image"}
                    name="image"
                    accept="image/*"
                    onChange={setImageFile}
                    selectedFileName={imageFile?.name}
                    helperText={currentImageUrl ? "Upload a new image to replace the current one" : "Upload an image for this article"}
                />

                <div className={styles.formGroup}>
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.published}
                            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
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
                        {submitting ? 'Updating...' : 'Update Article'}
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
    );
}
