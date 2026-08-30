import Title from '@/components/ui/Title'
import styles from './ArticleTitle.module.scss'

interface ArticleTitleProps {
    title: string
    subtitle?: string
}

export default function ArticleTitle({ title, subtitle }: ArticleTitleProps) {
    return (
        <div>
            <Title>{title}</Title>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
    )
}
