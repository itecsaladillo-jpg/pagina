import { getNewsFlashes, getPublicArticles } from '@/services/news'
import { getPublicActions } from '@/services/actions'
import { Sparkles, Calendar, Zap, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export async function ImpactSection() {
  const [news, actions, articles] = await Promise.all([
    getNewsFlashes(),
    getPublicActions(),
    getPublicArticles()
  ])

  // Combinar y ordenar por fecha de creación/inicio
  const feedItems = [
    ...news.map(n => ({ ...n, feedType: 'news' as const, date: new Date(n.created_at) })),
    ...actions.filter(a => a.start_date).map(a => ({ ...a, feedType: 'action' as const, date: new Date(a.start_date!) })),
    ...articles.map(art => ({ ...art, feedType: 'article' as const, date: new Date(art.created_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <section id="impacto" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Zap size={12} />
              Muro de Impacto
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Lo que está pasando hoy en <span className="text-gradient">ITEC</span>
            </h2>
            <p className="text-[var(--text-muted)] mt-6 text-lg leading-relaxed">
              Novedades, capacitaciones y acciones que transforman nuestra comunidad en tiempo real.
            </p>
          </div>
          
          <Link 
            href="/acciones"
            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all backdrop-blur-md"
          >
            Ver todas las acciones
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {feedItems.slice(0, 6).map((item, idx) => (
            <div 
              key={idx}
              className="group glass border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:border-blue-500/30 transition-all hover:scale-[1.02] duration-500"
            >
              {/* Header: Badge & Date */}
              <div className="p-6 flex items-center justify-between">
                <div className={`
                  flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter
                  ${item.feedType === 'action' ? 'bg-purple-500/10 text-purple-400' : 
                    item.feedType === 'article' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}
                `}>
                  {item.feedType === 'action' ? <Calendar size={12} /> : 
                   item.feedType === 'article' ? <Sparkles size={12} /> : <MessageSquare size={12} />}
                  {item.feedType === 'action' ? 'Evento/Capacitación' : 
                   item.feedType === 'article' ? 'Artículo Especial' : 'Novedad'}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase">
                  {format(item.date, "d 'de' MMMM", { locale: es })}
                </span>
              </div>

              {/* Content */}
              <div className="px-6 pb-8 flex-1 space-y-4">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 font-medium">
                  {item.feedType === 'news' ? item.flash_text : 
                   item.feedType === 'article' ? item.content : item.description}
                </p>
              </div>

              {/* Footer CTA */}
              <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 mt-auto">
                {item.feedType === 'action' ? (
                  <Link 
                    href={`/acciones/${item.id}`}
                    className="flex items-center justify-between text-xs font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    Saber más e inscribirme
                    <Zap size={14} className="text-blue-400" />
                  </Link>
                ) : (
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                    Comunicación Institucional
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/3" />
    </section>
  )
}
