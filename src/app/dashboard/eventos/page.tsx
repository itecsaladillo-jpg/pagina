import { Metadata } from 'next'
import { getCurrentMember, isAdmin } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare, Calendar, ShieldAlert, Tv, UserPlus, Play } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sistema de Preguntas — ITEC',
}

export default async function SistemaPreguntasDashboard() {
  const member = await getCurrentMember()
  if (!member || !isAdmin(member)) redirect('/dashboard')

  const supabase = await createClient()

  // Traemos las acciones/eventos de ITEC
  const { data: actions, error } = await supabase
    .from('itec_actions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching actions:', error)
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="text-indigo-400" size={32} />
          Sistema de Preguntas al Expositor
        </h1>
        <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
          Administrá las interacciones de tu audiencia en vivo. Seleccioná un evento para moderar las preguntas entrantes, proyectar el ranking dinámico en pantalla gigante o compartir el link del asistente.
        </p>
      </div>

      {/* Grid de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions && actions.length > 0 ? (
          actions.map((action) => (
            <div 
              key={action.id} 
              className={`rounded-2xl border p-6 bg-zinc-900/60 backdrop-blur-sm shadow-xl flex flex-col justify-between transition-all ${
                action.status === 'en_curso' 
                  ? 'border-indigo-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950/20' 
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    action.status === 'en_curso'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {action.status === 'en_curso' ? 'En Vivo' : action.status.replace('_', ' ')}
                  </span>
                  
                  <span className="text-xs text-zinc-500 font-medium">
                    {action.start_date ? new Date(action.start_date).toLocaleDateString('es-AR') : 'Sin fecha'}
                  </span>
                </div>

                {/* Título y descripción */}
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{action.title}</h3>
                <p className="text-sm text-zinc-400 mb-6 line-clamp-2 leading-relaxed">
                  {action.description || 'Sin descripción para esta acción.'}
                </p>
              </div>

              {/* Controles de Q&A */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="grid grid-cols-2 gap-3">
                  {/* Botón Asistente */}
                  <Link
                    href={`/eventos/${action.id}/preguntar`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all border border-zinc-700/50"
                  >
                    <UserPlus size={14} className="text-indigo-400" />
                    📱 Asistente
                  </Link>

                  {/* Botón Proyector */}
                  <Link
                    href={`/eventos/${action.id}/pantalla-preguntas`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all border border-zinc-700/50"
                  >
                    <Tv size={14} className="text-emerald-400" />
                    🖥️ Proyector
                  </Link>
                </div>

                {/* Botón Moderador Principal */}
                <Link
                  href={`/dashboard/eventos/${action.id}/moderacion`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold tracking-wider uppercase transition-all shadow-lg shadow-indigo-950/50"
                >
                  <ShieldAlert size={14} />
                  Moderar Preguntas
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20 space-y-4">
            <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">No hay acciones registradas</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
              Cargá un evento o capacitación en tu panel de ITEC para habilitar el Q&A y la proyección en vivo.
            </p>
            <div className="pt-2">
              <Link 
                href="/dashboard/acciones/nueva"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider"
              >
                Crear Primer Evento
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
