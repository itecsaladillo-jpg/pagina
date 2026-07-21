'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Calendar, ChevronLeft, Zap, MessageSquare, PlayCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es, enUS, pt } from 'date-fns/locale'
import { getYouTubeThumbnail } from '@/services/videos'

interface ArticleDetailClientProps {
  article: any
}

export function ArticleDetailClient({ article }: ArticleDetailClientProps) {
  const { language, dict } = useLanguage()

  // Buscar traducción en el diccionario
  const translation = (dict.impactSection as any).feedData?.[article.id]
  const displayTitle = translation?.title || article.title
  const displayExcerpt = translation?.excerpt || article.excerpt
  const displayContent = translation?.content || article.content

  // Traducciones de textos fijos
  const tVolver = language === 'en' ? 'Back to Actions Wall' : language === 'pt' ? 'Voltar ao Mural de Ações' : 'Volver al Muro de Acciones'
  const tVideoRelacionado = language === 'en' ? 'Related video · ITEC Video Library' : language === 'pt' ? 'Vídeo relacionado · Videoteca ITEC' : 'Video relacionado · Videoteca ITEC'
  const tVerEnVideoteca = language === 'en' ? 'Watch in the Video Library' : language === 'pt' ? 'Ver na Videoteca' : 'Ver en la Videoteca'
  const tSubtituloInstitucional = language === 'en' ? 'Institutional Communication and Technological Linkage' : language === 'pt' ? 'Comunicação Institucional e Vinculação Tecnológica' : 'Comunicación Institucional y Vinculación Tecnológica'

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Breadcrumb / Volver */}
      <Link href="/#acciones" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors text-xs uppercase font-bold tracking-widest group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        {tVolver}
      </Link>

      <article className="space-y-12">
        {/* Header */}
        <div className="space-y-6">
          <div className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10
            bg-blue-600/40 text-blue-100 border-blue-400/30
          `}>
            <Zap size={12} className="fill-blue-400" />
            {displayExcerpt || (language === 'en' ? 'Regional Impact' : language === 'pt' ? 'Impacto Regional' : 'Impacto Regional')}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
            {displayTitle}
          </h1>
          
          <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
            <Calendar size={16} className="text-blue-400" />
            <span>
              {format(new Date(article.created_at), language === 'en' ? "MMMM d, yyyy" : "d 'de' MMMM, yyyy", { 
                locale: language === 'en' ? enUS : language === 'pt' ? pt : es 
              })}
            </span>
          </div>
        </div>

        {/* Multimedia Gallery/Slider */}
        {(() => {
          let mediaUrls = article.media_urls
          if (typeof mediaUrls === 'string') {
            try {
              mediaUrls = JSON.parse(mediaUrls)
            } catch {
              mediaUrls = []
            }
          }
          if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) return null

          const isVideo = (u: string) => /\.(mp4|webm|mov)/i.test(u.split('?')[0])
          const firstUrl = mediaUrls[0]
          return (
            <div className="grid grid-cols-1 gap-4">
              <div className="aspect-video rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02]">
                {isVideo(firstUrl) ? (
                  <video src={firstUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={firstUrl} alt={displayTitle} className="w-full h-full object-cover" />
                )}
              </div>
              {mediaUrls.length > 1 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaUrls.slice(1).map((url: string, i: number) => (
                    <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
                      {isVideo(url) ? (
                        <video src={url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Content */}
        <div className="prose prose-invert prose-blue max-w-none">
          <div className="text-xl md:text-2xl text-[var(--text-secondary)] leading-relaxed font-serif italic border-l-4 border-blue-500 pl-8 py-2 mb-12">
            {displayContent.split('\n')[0]}
          </div>
          <div className="text-lg text-[var(--text-secondary)] leading-relaxed space-y-6 whitespace-pre-wrap">
            {displayContent.split('\n').slice(1).join('\n')}
          </div>
        </div>
      </article>

      {/* Video relacionado */}
      {article.related_video && (
        <div className="pt-8">
          <div className="flex items-start gap-6 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all group">
            {/* Miniatura YouTube */}
            <div className="relative w-36 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-black border border-white/5">
              <img
                src={getYouTubeThumbnail(article.related_video.youtube_url)}
                alt={article.related_video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                <PlayCircle size={28} className="text-amber-400" />
              </div>
            </div>
            {/* Texto */}
            <div className="flex flex-col justify-center gap-2 min-w-0">
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">{tVideoRelacionado}</span>
              <p className="text-white font-bold text-sm leading-tight line-clamp-2">{article.related_video.title}</p>
              <Link
                href={`/#videoteca`}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors mt-1"
              >
                <ExternalLink size={12} />
                {tVerEnVideoteca}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer of article */}
      <div className="pt-12 border-t border-white/5">
        <div className="flex items-center gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <MessageSquare className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">ITEC Saladillo</p>
            <p className="text-xs text-[var(--text-muted)]">{tSubtituloInstitucional}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
