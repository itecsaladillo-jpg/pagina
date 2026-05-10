'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, Zap, MessageSquare, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface ImpactCardProps {
  item: any
  idx: number
}

function ImpactCard({ item, idx }: ImpactCardProps) {
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0)
  
  const getFirstParagraph = (text: string) => {
    if (!text) return ''
    const lines = text.split('\n').filter(p => p.trim().length > 0)
    return lines[0] || text
  }

  const media = item.media_urls || []
  
  useEffect(() => {
    if (media.length > 1) {
      const interval = setInterval(() => {
        setCurrentMediaIdx(prev => (prev + 1) % media.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [media.length])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.1 }}
      className="group glass border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:border-blue-500/30 transition-all duration-500 bg-white/[0.01]"
    >
      {/* Slider Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
        {media.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMediaIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img 
                src={media[currentMediaIdx]} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                alt="" 
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            {item.feedType === 'action' ? <Calendar size={40} className="text-white/10" /> : <Sparkles size={40} className="text-white/10" />}
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

        <div className="absolute top-4 left-4 z-20">
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10
            ${item.feedType === 'action' ? 'bg-purple-500/30 text-purple-200' : 
              item.feedType === 'article' ? 'bg-blue-500/30 text-blue-200' : 'bg-emerald-500/30 text-emerald-200'}
          `}>
            {item.feedType === 'action' ? <Calendar size={12} /> : 
             item.feedType === 'article' ? <Sparkles size={12} /> : <MessageSquare size={12} />}
            {item.feedType === 'action' ? 'Evento' : 
             item.feedType === 'article' ? 'Artículo' : 'Novedad'}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-20 text-[10px] text-white/80 font-bold uppercase tracking-widest px-2 py-1">
          {format(new Date(item.date), "d 'de' MMMM", { locale: es })}
        </div>

        {media.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
            {media.map((_: any, i: number) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${i === currentMediaIdx ? 'bg-white w-4' : 'bg-white/20'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="p-8 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-snug mb-4">
          {item.title}
        </h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 font-medium mb-8">
          {item.feedType === 'news' ? item.flash_text : getFirstParagraph(item.feedType === 'article' ? item.content : item.description)}
        </p>

        <div className="mt-auto">
          {item.feedType === 'action' ? (
            <Link 
              href={`/acciones/${item.id}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors group/link"
            >
              Saber más e inscribirme
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : item.feedType === 'article' ? (
             <Link 
              href={`/articulo/${item.slug || item.id}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors group/link"
            >
              Leer artículo completo
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">
              Impacto Institucional
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function ImpactSectionClient({ news, actions, articles }: any) {
  const feedItems = [
    ...news.map((n: any) => ({ ...n, feedType: 'news' as const, date: n.created_at })),
    ...actions.filter((a: any) => a.start_date).map((a: any) => ({ ...a, feedType: 'action' as const, date: a.start_date })),
    ...articles.map((art: any) => ({ ...art, feedType: 'article' as const, date: art.created_at }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <section id="impacto" className="py-32 relative overflow-hidden bg-black">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <Zap size={12} className="fill-blue-400" />
              Muro de Impacto
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tighter">
              El motor que mueve a <br />
              <span className="text-gradient">Saladillo</span>
            </h2>
            <p className="text-[var(--text-muted)] mt-8 text-xl leading-relaxed max-w-xl">
              Explorá las últimas novedades, eventos y capacitaciones de ITEC que están transformando nuestra comunidad.
            </p>
          </div>
          
          <Link 
            href="/acciones"
            className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all backdrop-blur-md group"
          >
            Ver catálogo completo
            <ChevronRight className="inline ml-2 group-hover:translate-x-1 transition-transform" size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {feedItems.slice(0, 6).map((item, idx) => (
            <ImpactCard key={idx} item={item} idx={idx} />
          ))}
        </div>
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-600/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
    </section>
  )
}
