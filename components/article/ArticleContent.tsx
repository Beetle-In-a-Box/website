'use client'

import Text from '@/components/ui/Text'
import styles from './ArticleContent.module.scss'

interface ArticleContentProps {
    children: React.ReactNode
}

export default function ArticleContent({ children }: ArticleContentProps) {
    return (
        <Text indent className={styles.contents}>
            {children}
        </Text>
    )
}
