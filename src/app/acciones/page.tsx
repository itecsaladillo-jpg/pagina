import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicActions } from '@/services/actions'
import { Calendar, MapPin, Users, ArrowRight, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Acciones de Impacto — ITEC Saladillo',
  description: 'Descubrí las capacitaciones y eventos que el ITEC organiza para potenciar a la comunidad.',
}

export default async function AccionesPublicasPage() {
  const actions = await getPublicActions()

  return (
    <main className="min-h-screen bg-[#020617] pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest animate-fade-in">
            <Sparkles size={12} />
            Motor de Transformación
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight">
            Acciones que <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Transforman</span>
          </h1>
          <p className="max-w-2xl mx-auto text-[var(--text-secondary)] text-lg leading-relaxed">
            Explorá nuestro cronograma de capacitaciones, eventos sociales y actividades de divulgación tecnológica para Saladillo y la región.
          </p>
        </div>

        {/* Grid de Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {actions.length > 0 ? (
            actions.map((action) => (
              <Link 
                key={action.id} 
                href={`/acciones/${action.id}`}
                className="group relative flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all hover:translate-y-[-4px]"
              >
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden bg-white/5">
                  {action.thumbnail_url ? (
                    <img src={action.thumbnail_url} alt={action.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="text-white/10" size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                      {action.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-1 space-y-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
                    {action.title}
                  </h3>
                  
                  <p className="text-[var(--text-muted)] text-sm line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>

                  <div className="pt-4 mt-auto space-y-3">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
                      <Calendar size={14} className="text-blue-400" />
                      <span>{action.start_date ? new Date(action.start_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : 'Próximamente'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
                      <MapPin size={14} className="text-blue-400" />
                      <span>{action.location || 'Sede ITEC'}</span>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                      Saber más <ArrowRight size={14} />
                    </span>
                    {action.status === 'planificacion' && (
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded">Cupos Abiertos</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass border border-white/5 rounded-3xl">
              <p className="text-[var(--text-muted)] italic">No hay acciones programadas en este momento. ¡Volvé pronto!</p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
