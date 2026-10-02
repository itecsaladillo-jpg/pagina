import { getCurrentMember, isAdmin } from '@/services/auth'
import { redirect } from 'next/navigation'
import { Radio } from 'lucide-react'
import { getStreamingStatus } from './actions'
import { StreamingControls } from './StreamingControls'

export default async function StreamingPage() {
  const member = await getCurrentMember()
  if (!member) redirect('/login')

  const isUserAdmin = isAdmin(member)
  if (!isUserAdmin && member.role !== 'coordinador') {
    redirect('/dashboard')
  }

  // Obtener estado actual del streaming
  const streamingStatus = await getStreamingStatus()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-100 pb-16">
      {/* Encabezado */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Radio className="text-red-500 animate-pulse" size={28} />
            Transmisión en Vivo (Home)
          </h1>
          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
            Ingresá la URL de YouTube desde donde se recibirá el streaming y activá o desactivá el reproductor en la página principal.
          </p>
        </div>
      </div>

      {/* Panel principal de control */}
      <div className="w-full">
        <StreamingControls
          initialIsActive={streamingStatus.isActive}
          initialYoutubeUrl={streamingStatus.youtubeUrl || ''}
        />
      </div>
    </div>
  )
}
