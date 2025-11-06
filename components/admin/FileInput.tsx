'use client';

import { ChangeEvent } from 'react';
import styles from './Admin.module.scss';

interface FileInputProps {
    label: string;
    name: string;
    accept?: string;
    required?: boolean;
    onChange: (file: File | null) => void;
    selectedFileName?: string;
    helperText?: string;
}

export default function FileInput({
    label,
    name,
    accept,
    required = false,
    onChange,
    selectedFileName,
    helperText,
}: FileInputProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onChange(file);
    };

    const handleClear = () => {
        onChange(null);
        // Reset the input
        const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        if (input) input.value = '';
    };

    return (
        <div className={styles.formGroup}>
            <label htmlFor={name}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            {helperText && <p className={styles.helperText}>{helperText}</p>}
            <input
                type="file"
                id={name}
                name={name}
                accept={accept}
                onChange={handleChange}
                className={styles.fileInput}
            />
            {selectedFileName && (
                <div className={styles.selectedFile}>
                    <span>{selectedFileName}</span>
                    <button
                        type="button"
                        onClick={handleClear}
                        className={styles.clearButton}
                    >
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
}
