import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getActionById } from '@/services/actions'
import { ActionRegistrationForm } from '@/components/acciones/ActionRegistrationForm'
import { Calendar, MapPin, Users, Info, ChevronLeft, Sparkles, FileText } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const action = await getActionById(params.id)
  if (!action) return { title: 'Acción no encontrada' }
  return { title: `${action.title} — ITEC Saladillo` }
}

export default async function AccionDetailPage({ params }: Props) {
  const action = await getActionById(params.id)
  if (!action) notFound()

  return (
    <main className="min-h-screen bg-[#020617] pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Breadcrumb / Volver */}
        <Link href="/acciones" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors text-xs uppercase font-bold tracking-widest group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver al Catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* ─── LADO IZQUIERDO: DETALLES ─── */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                {action.type.replace('_', ' ')}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {action.title}
              </h1>
              
              <div className="flex flex-wrap gap-6 items-center pt-4">
                <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">
                  <Calendar size={18} className="text-blue-400" />
                  <span>{action.start_date ? new Date(action.start_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Fecha a definir'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">
                  <MapPin size={18} className="text-blue-400" />
                  <span>{action.location || 'Sede ITEC'}</span>
                </div>
              </div>
            </div>

            {/* Thumbnail Hero */}
            <div className="aspect-video relative rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02]">
              {action.thumbnail_url ? (
                <img src={action.thumbnail_url} alt={action.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10">
                  <Sparkles size={120} />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Info size={20} className="text-blue-400" />
                Sobre esta acción
              </h2>
              <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
                {action.description?.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Información Adicional Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Público Objetivo</p>
                <p className="text-white font-medium">{action.target_audience || 'Abierto a la comunidad'}</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Inversión / Costo</p>
                <p className="text-white font-medium">{action.cost > 0 ? `$${action.cost}` : 'Actividad Gratuita'}</p>
              </div>
            </div>
          </div>

          {/* ─── LADO DERECHO: INSCRIPCIÓN ─── */}
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="glass border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl shadow-blue-900/10">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Inscripción</h3>
                <p className="text-[var(--text-muted)] text-xs">Completá tus datos para asegurar tu lugar.</p>
              </div>
              
              {action.status === 'planificacion' || action.status === 'en_curso' ? (
                <ActionRegistrationForm actionId={action.id} capacity={action.capacity} />
              ) : (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
                  <p className="text-red-400 font-bold text-xs uppercase tracking-widest">Inscripciones Cerradas</p>
                  <p className="text-[var(--text-muted)] text-[10px]">Esta acción ya ha finalizado o los cupos están completos.</p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-4 flex items-start gap-3 opacity-40">
                <FileText size={16} className="shrink-0 mt-1" />
                <p className="text-[10px] leading-relaxed">
                  Al inscribirte, aceptás nuestra política de comunicación interna. Recibirás un recordatorio vía email o teléfono días antes del evento.
                </p>
              </div>
            </div>

            {/* Badge de ITEC */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                i
              </div>
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Sello ITEC</p>
                <p className="text-[var(--text-muted)] text-[10px]">Garantía de calidad institucional y técnica.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  )
}
