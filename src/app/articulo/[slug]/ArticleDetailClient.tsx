'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Calendar, ChevronLeft, ChevronRight, Zap, MessageSquare, PlayCircle, ExternalLink, Play, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es, enUS, pt } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { getYouTubeThumbnail } from '@/services/videos'
import { toUtcLocalDate } from '@/lib/dates'

interface ArticleDetailClientProps {
  article: any
}

const isVideoUrl = (u: string) => /\.(mp4|webm|mov)/i.test(u.split('?')[0])

function MediaSlideshow({ mediaUrls, title }: { mediaUrls: string[]; title: string }) {
  const [current, setCurrent] = useState(0)

  const goPrev = () => setCurrent(c => (c === 0 ? mediaUrls.length - 1 : c - 1))
  const goNext = () => setCurrent(c => (c === mediaUrls.length - 1 ? 0 : c + 1))

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mediaUrls.length])

  const url = mediaUrls[current]
  const isVideo = isVideoUrl(url)

  return (
    <div className="group relative rounded-3xl overflow-hidden border border-white/5 bg-black/40">
      <div className="min-h-[220px] flex items-center justify-center p-4">
        {isVideo ? (
          <video
            key={current}
            src={url}
            controls
            className="max-w-full max-h-[65vh] w-auto h-auto object-contain rounded-xl"
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={url}
              alt={`${title} - Imagen ${current + 1}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-full max-h-[65vh] w-auto h-auto object-contain rounded-xl"
              loading="lazy"
              decoding="async"
            />
          </AnimatePresence>
        )}
      </div>

      {mediaUrls.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Imagen anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/80">
            {isVideo ? <Play size={10} /> : <ImageIcon size={10} />}
            {current + 1} / {mediaUrls.length}
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 backdrop-blur-sm p-1.5 rounded-full border border-white/5">
            {mediaUrls.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Ir a imagen ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
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
              {format(toUtcLocalDate(article.created_at), language === 'en' ? "MMMM d, yyyy" : "d 'de' MMMM, yyyy", { 
                locale: language === 'en' ? enUS : language === 'pt' ? pt : es 
              })}
            </span>
          </div>
        </div>

        {/* Multimedia Gallery/Slider — todas las imágenes en slide con formato original */}
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
          return <MediaSlideshow mediaUrls={mediaUrls} title={displayTitle} />
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
