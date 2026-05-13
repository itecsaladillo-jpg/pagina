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
    // Dividir por saltos de línea y tomar el primero que tenga contenido
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0)
    return paragraphs[0] || text
  }

  const media = item.media_urls || []
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    if (media.length > 1) {
      // Retraso inicial aleatorio (0 a 4s) para que no arranquen todos juntos
      const initialDelay = Math.random() * 4000;
      // Intervalo de ciclo variado (5s a 7s)
      const intervalTime = 5000 + (Math.random() * 2000);

      timeoutId = setTimeout(() => {
        setCurrentMediaIdx(prev => (prev + 1) % media.length);
        intervalId = setInterval(() => {
          setCurrentMediaIdx(prev => (prev + 1) % media.length);
        }, intervalTime);
      }, initialDelay);
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [media.length, idx]) // Incluimos idx por seguridad although random es suficiente

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
        <AnimatePresence mode="wait">
          {media.length > 0 ? (
            <motion.div
              key={currentMediaIdx}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={media[currentMediaIdx]} 
                className="w-full h-full object-cover" 
                alt={item.title} 
              />
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              {item.feedType === 'action' ? <Calendar size={40} className="text-white/10" /> : <Sparkles size={40} className="text-white/10" />}
            </div>
          )}
        </AnimatePresence>
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

        {/* Badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10
            ${item.feedType === 'action' ? 'bg-purple-500/30 text-purple-200' : 
              item.feedType === 'article' ? 'bg-blue-600/40 text-blue-100 border-blue-400/30' : 'bg-emerald-500/30 text-emerald-200'}
          `}>
            {item.feedType === 'action' ? <Calendar size={12} /> : 
             item.feedType === 'article' ? <Zap size={12} className="fill-blue-400" /> : <MessageSquare size={12} />}
            {item.feedType === 'action' ? 'Evento' : 
             item.feedType === 'article' ? (item.excerpt || 'Impacto Regional') : 'Novedad'}
          </div>
        </div>

        {/* Indicators */}
        {media.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/20 backdrop-blur-sm p-1.5 rounded-full border border-white/5">
            {media.map((_: any, i: number) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === currentMediaIdx ? 'bg-blue-400 w-4' : 'bg-white/20'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] mb-1">
          {format(new Date(item.date), "d 'de' MMMM, yyyy", { locale: es })}
        </div>
        
        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-tight mb-2">
          {item.title}
        </h3>
        
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium mb-4 italic">
          {item.feedType === 'news' ? item.flash_text : getFirstParagraph(item.feedType === 'article' ? item.content : item.description)}
        </p>

        <div className="mt-auto pt-3 border-t border-white/5">
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
              Leer historia completa
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="text-[10px] text-blue-400/50 font-black uppercase tracking-[0.2em]">
              Noticia Institucional
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
    <section id="acciones" className="pt-7 pb-14 relative overflow-hidden bg-black scroll-mt-16">
      <div className="max-w-7xl mx-auto w-full px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Primera fila: Título + 2 Cards */}
          <div className="lg:col-span-1 space-y-6 lg:pt-0">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5 mb-4">
              ITEC EN MOVIMIENTO
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter">
              Un motor <br />
              que mueve <br />
              a <span className="text-gradient">Saladillo</span>
            </h2>
            <p className="text-[var(--text-muted)] text-lg md:text-xl leading-relaxed max-w-none">
              Explorá las últimas novedades, <br />
              eventos y capacitaciones de ITEC <br />
              que están transformando <br />
              nuestra comunidad.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
            {feedItems.slice(0, 2).map((item: any, idx: number) => (
              <ImpactCard key={idx} item={item} idx={idx} />
            ))}
          </div>
        </div>

        {/* Filas siguientes: 3 Cards por fila */}
        {feedItems.length > 2 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {feedItems.slice(2, 8).map((item: any, idx: number) => (
              <ImpactCard key={idx + 2} item={item} idx={idx + 2} />
            ))}
          </div>
        )}
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-600/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
    </section>
  )
}
