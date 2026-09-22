import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticleBySlug } from '@/services/news'
import { ArticleDetailClient } from './ArticleDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: 'Artículo no encontrado' }
  return { 
    title: `${article.title} | ITEC Saladillo`,
    description: article.excerpt || article.content.slice(0, 160)
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-6">
      <ArticleDetailClient article={JSON.parse(JSON.stringify(article))} />
    </main>
  )
}
