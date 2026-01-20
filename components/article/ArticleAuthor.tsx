import Link from '@/components/ui/Link'
import AuthorLink from '@/components/ui/AuthorLink'
import Text from '@/components/ui/Text'
import styles from './ArticleAuthor.module.scss'

interface ArticleAuthorProps {
    author: {
        name: string
        slug: string
    } | string | null
    role?: string
}

export default function ArticleAuthor({
    author,
    role = 'Staff Writer',
}: ArticleAuthorProps) {
    if (!author) {
        return null
    }

    return (
        <Text className={styles.authorAttr}>
            By{' '}
            {typeof author === 'string' ? (
                <Link href="/about" target="_blank" variant="bold">
                    {author}
                </Link>
            ) : (
                <AuthorLink name={author.name} slug={author.slug} />
            )}{' '}
            | {role}
        </Text>
    )
}
