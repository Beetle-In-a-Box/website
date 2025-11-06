import Title from '@/components/ui/Title'

interface ArticleTitleProps {
    title: string
}

export default function ArticleTitle({ title }: ArticleTitleProps) {
    return <Title>{title}</Title>
}
