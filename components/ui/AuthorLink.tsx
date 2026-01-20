import Link from '@/components/ui/Link'

interface AuthorLinkProps {
    name: string
    slug: string
    className?: string
}

export default function AuthorLink({
    name,
    slug,
    className,
}: AuthorLinkProps) {
    return (
        <Link href={`/author/${slug}`} className={className}>
            {name}
        </Link>
    )
}
