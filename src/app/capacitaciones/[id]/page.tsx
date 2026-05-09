import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LivePoll } from '@/components/capacitaciones/LivePoll'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TrainingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: training } = await supabase
    .from('trainings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!training) notFound()

  // Extraer ID de Youtube
  const videoId = training.youtube_url?.split('v=')[1]?.split('&')[0] || training.youtube_url?.split('/').pop()

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[var(--accent-primary)]">
      {/* Mobile Top Bar */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        <Link href="/dashboard/capacitaciones" className="p-2 -ml-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-sm font-bold truncate tracking-tight">{training.title}</h1>
        {training.is_live && (
          <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-red-500 rounded text-[9px] font-black uppercase tracking-tighter animate-pulse">
            LIVE
          </span>
        )}
      </div>

      <div className="max-w-md mx-auto">
        {/* Video Player Section */}
        <div className="aspect-video bg-zinc-900 sticky top-0 z-20 shadow-2xl">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs">
              Streaming no disponible
            </div>
          )}
        </div>

        {/* Info & Polls */}
        <div className="p-6 space-y-8">
          <header>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-[var(--accent-primary-2)] uppercase tracking-widest">Capacitación Técnica</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 leading-tight">{training.title}</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              {training.description || 'Sin descripción adicional para este encuentro.'}
            </p>
          </header>

          {/* Sistema de Encuestas en Tiempo Real */}
          <LivePoll trainingId={training.id} />

          {/* Footer Informativo */}
          <div className="pt-12 pb-24 border-t border-white/5 text-center">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">Plataforma ITEC Interactiva</p>
            <div className="flex justify-center gap-6 opacity-30">
              <div className="w-8 h-8 rounded-full border border-white" />
              <div className="w-8 h-8 rounded-full border border-white" />
              <div className="w-8 h-8 rounded-full border border-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
