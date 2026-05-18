import { getCurrentMember, isAdmin } from '@/services/auth'
import { redirect } from 'next/navigation'
import { 
  Tv, 
  Radio, 
  Settings, 
  AlertCircle, 
  ExternalLink,
  Laptop,
  Users,
  Video,
  Monitor,
  Heart
} from 'lucide-react'
import Link from 'next/link'

export default async function StreamingPage() {
  const member = await getCurrentMember()
  if (!member) redirect('/login')
  
  const isUserAdmin = isAdmin(member)
  if (!isUserAdmin && member.role !== 'coordinador') {
    redirect('/dashboard')
  }

  // Enlace fijo a Google Meet configurado en .env
  const meetLink = process.env.NEXT_PUBLIC_MEET_LINK ?? 'https://meet.google.com/itec-reunion'

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 pb-16">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Radio className="text-red-500 animate-pulse" size={32} />
            Centro de Transmisión & Streaming
          </h1>
          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
            Gestioná la transmisión en vivo de tus torneos, capacitaciones y eventos ITEC Augusto Cicaré.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest self-start md:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          Transmisión Lista
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Monitor de Señal / OBS Setup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player Placeholder */}
          <div className="relative aspect-video rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl flex flex-col items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/10 via-transparent to-red-950/10 pointer-events-none" />
            <Monitor size={48} className="text-zinc-700 mb-3 group-hover:scale-105 transition-transform" />
            <p className="text-zinc-400 font-bold text-sm">Vista previa de transmisión</p>
            <p className="text-zinc-600 text-xs mt-1">Conecta tu encoder (vMix / OBS) para iniciar la señal</p>
            
            {/* Overlay de estadísticas */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-zinc-500 font-medium">
              <span>Resolución: 1280x720 (Recomendada)</span>
              <span>FPS: 0</span>
              <span>Bitrate: 0 Kbps</span>
            </div>
          </div>

          {/* Instrucciones de Configuración */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-3xl backdrop-blur-sm space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="text-purple-400" size={20} />
              Configuración de Encoders (OBS / vMix)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-purple-400">1. Servidor de Transmisión</h4>
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs select-all text-zinc-300">
                  rtmp://streaming.itec.edu.ar/live
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-purple-400">2. Clave de Transmisión</h4>
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs select-all text-zinc-300">
                  itec_cicre_live_2026_prod
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-zinc-400 leading-relaxed">
              <strong>💡 Consejo de Transmisión:</strong> Para obtener la mejor fidelidad en los overlays horizontales y alertas de impacto de gol, configure su canvas en OBS/vMix en **1280x720 a 30 FPS** con un bitrate de video sugerido de **3500 Kbps**.
            </div>
          </div>
        </div>

        {/* Columna Derecha: Controles Rápidos y Overlays */}
        <div className="space-y-6">
          
          {/* Sala Principal Google Meet */}
          <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900/40 border border-blue-500/10 p-6 rounded-3xl space-y-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Video size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sala de Reunión Fija</h3>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Meet Principal</p>
              </div>
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed">
              Accede de manera directa a la videoconferencia de la comisión técnica y transmisión de eventos.
            </p>
            <a 
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-blue-600/15"
            >
              Unirse a Google Meet
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Enlaces de Overlays Broadcast */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Laptop className="text-amber-400" size={18} />
              Capas del vMix / OBS (Overlays)
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Agregá estas fuentes de navegador en tu software de streaming para renderizar gráficos en vivo:
            </p>
            
            <div className="space-y-2">
              {[
                { label: 'Marcadores Proyectados', path: '/overlay/marcadores' },
                { label: 'Alertas de Impacto Gol', path: '/overlay/goles' },
                { label: 'Tabla de Posiciones Live', path: '/overlay/posiciones' },
              ].map((overlay) => (
                <div key={overlay.path} className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 group">
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">{overlay.label}</p>
                    <p className="text-[10px] text-zinc-600 font-mono mt-0.5 truncate max-w-[150px]">{overlay.path}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}${overlay.path}`)
                        alert('¡Enlace copiado al portapapeles!')
                      }
                    }}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider"
                  >
                    Copiar URL
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
