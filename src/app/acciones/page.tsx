import type { Metadata } from 'next'
import { getPublicActions } from '@/services/actions'
import { getPublicArticles } from '@/services/news'
import { AccionesClient } from './AccionesClient'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Acciones de Impacto — ITEC Saladillo',
  description: 'Descubrí las capacitaciones, eventos e historias de impacto que el ITEC organiza para potenciar a Saladillo.',
}

export default async function AccionesPublicasPage() {
  const [actions, articles] = await Promise.all([
    getPublicActions(),
    getPublicArticles()
  ])

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
          <p className="max-w-2xl mx-auto text-[var(--text-secondary)] text-lg leading-relaxed font-medium">
            Explorá nuestro catálogo unificado de capacitaciones, eventos, actividades de divulgación e historias de impacto del ecosistema productivo.
          </p>
        </div>

        {/* Componente Cliente Integrado con Tabs y Filtros */}
        <AccionesClient 
          actions={JSON.parse(JSON.stringify(actions))} 
          articles={JSON.parse(JSON.stringify(articles))} 
        />

      </div>
    </main>
  )
}

