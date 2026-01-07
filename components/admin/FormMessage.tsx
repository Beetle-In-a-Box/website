'use client';

import styles from './FormMessage.module.scss';

interface FormMessageProps {
    type: 'success' | 'error';
    message: string;
    onClose?: () => void;
}

export default function FormMessage({ type, message, onClose }: FormMessageProps) {
    return (
        <div className={`${styles.formMessage} ${styles[type]}`}>
            <span>{message}</span>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className={styles.closeButton}
                    aria-label="Close message"
                >
                    ×
                </button>
            )}
        </div>
    );
}
