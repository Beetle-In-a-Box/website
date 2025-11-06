'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createIssue } from '@/utils/api-client';
import FileInput from '@/components/admin/FileInput';
import FormMessage from '@/components/admin/FormMessage';
import styles from '@/components/admin/Admin.module.scss';

export default function NewIssuePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        number: '',
        date: '',
        published: false,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('number', formData.number);
        data.append('date', formData.date);
        data.append('published', String(formData.published));

        if (imageFile) {
            data.append('image', imageFile);
        }

        const result = await createIssue(data);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
            setSubmitting(false);
        } else {
            setMessage({ type: 'success', text: 'Issue created successfully!' });
            setTimeout(() => {
                router.push('/admin/issues');
            }, 1500);
        }
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Create New Issue</h1>
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
                    <label htmlFor="number">
                        Issue Number<span className={styles.required}>*</span>
                    </label>
                    <input
                        type="number"
                        id="number"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        required
                        min="1"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="date">
                        Date<span className={styles.required}>*</span>
                    </label>
                    <input
                        type="date"
                        id="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                </div>

                <FileInput
                    label="Cover Image"
                    name="image"
                    accept="image/*"
                    onChange={setImageFile}
                    selectedFileName={imageFile?.name}
                    helperText="Upload a cover image for this issue (optional)"
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
                        {submitting ? 'Creating...' : 'Create Issue'}
                    </button>
                    <button
                        type="button"
                        className={styles.btn}
                        onClick={() => router.push('/admin/issues')}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
