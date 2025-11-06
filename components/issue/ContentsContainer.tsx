import Title from '@/components/ui/Title'
import styles from './ContentsContainer.module.scss'

interface ContentsContainerProps {
    children: React.ReactNode
    title?: string
}

export default function ContentsContainer({
    children,
    title,
}: ContentsContainerProps) {
    return (
        <div className={styles.contentsContainer}>
            {title && (
                <div className={styles.titleWrapper}>
                    <Title>{title}</Title>
                </div>
            )}
            {children}
        </div>
    )
}
