import { notFound } from 'next/navigation'
import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'
import ArticlePreview from '@/components/issue/ArticlePreview'
import Empty from '@/components/ui/Empty'
import { prisma } from '@/utils/prisma'

export const dynamic = 'force-dynamic'

async function getAuthorBySlug(slug: string) {
    try {
        return await prisma.author.findUnique({
            where: { slug },
            include: {
                articles: {
                    where: { published: true },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        issue: true,
                        author: true,
                    },
                },
            },
        })
    } catch (error) {
        console.error('Error fetching author:', error)
        return null
    }
}

export default async function AuthorPage({
    params,
}: {
    params: { slug: string }
}) {
    const author = await getAuthorBySlug(params.slug)

    if (!author) {
        notFound()
    }

    if (author.articles.length === 0) {
        return (
            <MainContainer>
                <NavBar clickable={true} />
                <ContentsContainer title={`${author.name}`}>
                    <Empty>No published articles by this author yet.</Empty>
                </ContentsContainer>
                <FloatingBar showAbout={true} showLatest={true} />
                <Footer />
            </MainContainer>
        )
    }

    return (
        <MainContainer>
            <NavBar clickable={true} />
            <ContentsContainer title={`${author.name}`}>
                <div className="text contents previewContainer">
                    {author.articles.map(article => (
                        <ArticlePreview
                            key={article.id}
                            id={article.id}
                            title={article.title}
                            author={{
                                name: article.author?.name || 'Unknown',
                                slug: article.author?.slug || '',
                            }}
                            previewText={article.previewText}
                            imageUrl={
                                article.imageUrl ||
                                '/default-article-cover.png'
                            }
                            articleUrl={`/issue/${article.issue?.number}/${article.fileName}`}
                            imageArtist={article.imageArtist || undefined}
                        />
                    ))}
                </div>
            </ContentsContainer>
            <FloatingBar showAbout={true} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
