import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticleBySlug } from '@/services/news'
import { Calendar, ChevronLeft, Zap, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Breadcrumb / Volver */}
        <Link href="/#acciones" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors text-xs uppercase font-bold tracking-widest group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver al Muro de Acciones
        </Link>

        <article className="space-y-12">
          {/* Header */}
          <div className="space-y-6">
            <div className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10
              bg-blue-600/40 text-blue-100 border-blue-400/30
            `}>
              <Zap size={12} className="fill-blue-400" />
              {article.excerpt || 'Impacto Regional'}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <Calendar size={16} className="text-blue-400" />
              <span>{format(new Date(article.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
          </div>

          {/* Multimedia Gallery/Slider */}
          {article.media_urls && article.media_urls.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              <div className="aspect-video rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02]">
                <img 
                  src={article.media_urls[0]} 
                  alt={article.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              {article.media_urls.length > 1 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {article.media_urls.slice(1).map((url, i) => (
                    <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert prose-blue max-w-none">
            <div className="text-xl md:text-2xl text-[var(--text-secondary)] leading-relaxed font-serif italic border-l-4 border-blue-500 pl-8 py-2 mb-12">
              {article.content.split('\n')[0]}
            </div>
            <div className="text-lg text-[var(--text-secondary)] leading-relaxed space-y-6 whitespace-pre-wrap">
              {article.content.split('\n').slice(1).join('\n')}
            </div>
          </div>
        </article>

        {/* Footer of article */}
        <div className="pt-12 border-t border-white/5">
          <div className="flex items-center gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">ITEC Saladillo</p>
              <p className="text-xs text-[var(--text-muted)]">Comunicación Institucional y Vinculación Tecnológica</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
