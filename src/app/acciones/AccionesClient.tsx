'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Zap, Sparkles, ChevronRight, Search, SlidersHorizontal, BookOpen, Film } from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS, pt } from 'date-fns/locale'
import Link from 'next/link'
import { getYouTubeID } from '@/services/videos'
import { useLanguage } from '@/contexts/LanguageContext'

interface AccionesClientProps {
  actions: any[]
  articles: any[]
}

export function AccionesClient({ actions, articles }: AccionesClientProps) {
  const { language, dict } = useLanguage()
  const [activeTab, setActiveTab] = useState<'all' | 'actions' | 'articles'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Unificar y estructurar items
  const allItems = useMemo(() => {
    const actItems = actions.map((a) => {
      const translation = (dict.impactSection as any).feedData?.[a.id]
      const displayTitle = translation?.title || a.title
      const displayDescription = translation?.description || a.description || ''
      const displayExcerpt = translation?.excerpt || a.excerpt

      return {
        ...a,
        feedType: 'action' as const,
        date: a.start_date || a.created_at,
        badgeText: a.type === 'capacitacion' 
          ? (language === 'en' ? 'Training' : language === 'pt' ? 'Capacitação' : 'Capacitación') 
          : a.type === 'evento_social' 
            ? (language === 'en' ? 'Social Event' : language === 'pt' ? 'Evento Social' : 'Evento Social') 
            : (language === 'en' ? 'Outreach' : language === 'pt' ? 'Divulgação' : 'Divulgación'),
        badgeColor: 'bg-purple-500/20 text-purple-200 border-purple-400/20',
        title: displayTitle,
        descriptionText: displayDescription,
        linkUrl: `/acciones/${a.id}`,
        linkText: dict.impactSection.saberMas || 'Saber más e inscribirme',
        imageUrl: a.thumbnail_url,
        tagsList: a.tags || []
      }
    })

    const artItems = articles.map((art) => {
      const translation = (dict.impactSection as any).feedData?.[art.id]
      const displayTitle = translation?.title || art.title
      const displayContent = translation?.content || art.content || ''
      const displayExcerpt = translation?.excerpt || art.excerpt

      return {
        ...art,
        feedType: 'article' as const,
        date: art.created_at,
        badgeText: displayExcerpt || (language === 'en' ? 'Communication' : language === 'pt' ? 'Comunicação' : 'Comunicación'),
        badgeColor: 'bg-blue-600/30 text-blue-100 border-blue-400/20',
        title: displayTitle,
        descriptionText: displayContent,
        linkUrl: `/articulo/${art.slug || art.id}`,
        linkText: dict.impactSection.leerHistoria || 'Leer historia completa',
        imageUrl: art.media_urls?.[0] || null,
        tagsList: [
          language === 'en' ? 'Communication' : language === 'pt' ? 'Comunicação' : 'Comunicación',
          language === 'en' ? 'Impact' : language === 'pt' ? 'Impacto' : 'Impacto',
          displayExcerpt || (language === 'en' ? 'Strategic' : language === 'pt' ? 'Estratégica' : 'Estratégica')
        ].filter(Boolean)
      }
    })

    return [...actItems, ...artItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [actions, articles, dict, language])

  // 2. Filtrar items por tab y búsqueda
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Filtro por tab
      if (activeTab === 'actions' && item.feedType !== 'action') return false
      if (activeTab === 'articles' && item.feedType !== 'article') return false

      // Filtro por búsqueda
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchesTitle = item.title?.toLowerCase().includes(query)
        const matchesDesc = item.descriptionText?.toLowerCase().includes(query)
        const matchesTags = item.tagsList?.some((t: string) => t.toLowerCase().includes(query))
        return matchesTitle || matchesDesc || matchesTags
      }

      return true
    })
  }, [allItems, activeTab, searchQuery])

  // Helper para obtener el primer párrafo
  const getFirstParagraph = (text: string) => {
    if (!text) return ''
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0)
    return paragraphs[0] || text
  }

  return (
    <div className="space-y-12">
      {/* Barra de Filtros e Interacción */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-md">
        {/* Selector de Pestañas (Glow & Glassmorphism) */}
        <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 w-full md:w-auto relative overflow-hidden">
          <button
            id="tab-all"
            onClick={() => setActiveTab('all')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'all'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.15)]'
                : 'text-[var(--text-muted)] hover:text-white border border-transparent'
            }`}
          >
            {language === 'en' ? 'All' : language === 'pt' ? 'Tudo' : 'Todo'}
          </button>
          <button
            id="tab-actions"
            onClick={() => setActiveTab('actions')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'actions'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(147,51,234,0.15)]'
                : 'text-[var(--text-muted)] hover:text-white border border-transparent'
            }`}
          >
            {language === 'en' ? 'Trainings & Events' : language === 'pt' ? 'Capacitações e Eventos' : 'Capacitaciones y Eventos'}
          </button>
          <button
            id="tab-articles"
            onClick={() => setActiveTab('articles')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'articles'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.15)]'
                : 'text-[var(--text-muted)] hover:text-white border border-transparent'
            }`}
          >
            {language === 'en' ? 'Strategic Communication' : language === 'pt' ? 'Comunicação Estratégica' : 'Comunicación Estratégica'}
          </button>
        </div>

        {/* Buscador Integrado */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input
            id="search-input"
            type="text"
            placeholder={language === 'en' ? 'Search by title, topic...' : language === 'pt' ? 'Buscar por título, tema...' : 'Buscar por título, tema...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Grilla Principal */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <motion.div
                key={item.feedType + '-' + item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                className="group relative flex flex-col bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/20 transition-all duration-500"
              >
                {/* Imagen del Item */}
                <div className="aspect-[16/10] relative overflow-hidden bg-black/40">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                      {item.feedType === 'action' ? (
                        <Calendar className="text-white/10" size={40} />
                      ) : (
                        <Zap className="text-white/10" size={40} />
                      )}
                    </div>
                  )}

                  {/* Degradado sobre la imagen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Insignia / Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 ${item.badgeColor}`}>
                      {item.feedType === 'action' ? <Calendar size={10} /> : <Zap size={10} className="fill-blue-400" />}
                      {item.badgeText}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 flex flex-col flex-1 space-y-4">
                  {/* Fecha */}
                  <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">
                    {format(new Date(item.date), language === 'en' ? "MMMM d, yyyy" : "d 'de' MMMM, yyyy", { 
                      locale: language === 'en' ? enUS : language === 'pt' ? pt : es 
                    })}
                  </span>

                  {/* Título */}
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Descripción / Contenido */}
                  <p className="text-[var(--text-secondary)] text-sm line-clamp-3 leading-relaxed font-medium">
                    {getFirstParagraph(item.descriptionText)}
                  </p>

                  {/* Tags */}
                  {item.tagsList && item.tagsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.tagsList.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="text-[9px] font-bold text-blue-400/80 uppercase tracking-wider bg-blue-500/5 border border-blue-500/10 px-2.5 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Acciones del pie de tarjeta */}
                  <div className="pt-6 mt-auto border-t border-white/5 flex flex-col gap-3">
                    <Link
                      href={item.linkUrl}
                      className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors group/link"
                    >
                      {item.linkText}
                      <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>

                    {/* Enlace a Video Relacionado si existe */}
                    {item.feedType === 'article' && item.related_video && (
                      <Link
                        href={`/#videoteca?video=${item.related_video.id}`}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400/80 hover:text-amber-300 transition-colors"
                      >
                        <Film size={12} className="flex-shrink-0" />
                        {dict.impactSection.verVideoteca || 'Ver video:'} <span className="truncate max-w-[140px] font-semibold">{item.related_video.title}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full py-20 text-center glass border border-white/5 rounded-3xl flex flex-col items-center justify-center space-y-4"
            >
              <SlidersHorizontal size={40} className="text-white/10 animate-pulse" />
              <p className="text-[var(--text-muted)] italic font-medium">
                No encontramos publicaciones que coincidan con tu búsqueda o selección.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
