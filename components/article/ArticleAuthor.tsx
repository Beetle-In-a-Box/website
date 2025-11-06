import Link from '@/components/ui/Link'
import Text from '@/components/ui/Text'
import styles from './ArticleAuthor.module.scss'

interface ArticleAuthorProps {
    author: string
    role?: string
}

export default function ArticleAuthor({
    author,
    role = 'Staff Writer',
}: ArticleAuthorProps) {
    return (
        <Text className={styles.authorAttr}>
            By{' '}
            <Link href="/about" target="_blank" variant="bold">
                {author}
            </Link>{' '}
            | {role}
        </Text>
    )
}
