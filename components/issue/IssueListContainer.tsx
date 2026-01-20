import Title from '@/components/ui/Title'
import styles from './IssueListContainer.module.scss'

interface IssueListContainerProps {
    children: React.ReactNode
    title?: string
}

export default function IssueListContainer({
    children,
    title,
}: IssueListContainerProps) {
    return (
        <div className={styles.container}>
            {title && <Title>{title}</Title>}
            <div className={styles.list}>{children}</div>
        </div>
    )
}
