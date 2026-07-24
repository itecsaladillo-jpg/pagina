'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, Clock, Download, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MedioForm } from '@/app/dashboard/prensa/MedioForm'
import { getGacetillaEnviosHistory } from '@/app/dashboard/prensa/actions'
import { SendGacetillaModal } from '@/components/prensa/SendGacetillaModal'
import { PrensaEnviosHistoryModal } from '@/components/prensa/PrensaEnviosHistoryModal'
import type { PrensaEnvioLog } from '@/types/database'

interface PressFlash {
  id: string
  created_at: string
  titulo: string
  texto_medios: string
  media_urls: string[]
}

export default function PressNewsPage() {
  const [pressFlashes, setPressFlashes] = useState<PressFlash[]>([])
  const [showForm, setShowForm] = useState(false)
  const [sendModal, setSendModal] = useState<PressFlash | null>(null)
  const [historyModal, setHistoryModal] = useState<{ flash: PressFlash; logs: PrensaEnvioLog[] } | null>(null)
  const [enviosCount, setEnviosCount] = useState<Record<string, { count: number; latestDate: string }>>({})

  const loadPressFlashes = () => {
    fetch('/api/press-news')
      .then(r => r.json())
      .then(d => setPressFlashes(d))
      .catch(() => {})
  }

  useEffect(() => {
    loadPressFlashes()
  }, [])

  useEffect(() => {
    if (pressFlashes.length === 0) return
    Promise.all(
      pressFlashes.map(async (f) => {
        const logs = await getGacetillaEnviosHistory(f.id)
        const enviados = logs.filter((l: any) => l.status === 'enviado')
        return {
          id: f.id,
          count: enviados.length,
          latestDate: enviados.length > 0 ? enviados[0].created_at : '',
        }
      })
    ).then(results => {
      const map: Record<string, { count: number; latestDate: string }> = {}
      results.forEach(r => { map[r.id] = { count: r.count, latestDate: r.latestDate } })
      setEnviosCount(map)
    })
  }, [pressFlashes])

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMMM, yyyy '·' HH:mm", { locale: es })
  }

  const isVideoUrl = (u: string) => /\.(mp4|webm|mov)/i.test(u.split('?')[0])

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Prensa</h1>
          <p className="text-white/60 text-sm">
            Gacetillas y comunicados para medios de comunicación
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary text-xs py-2 px-6 rounded-xl flex items-center gap-2"
        >
          <Plus size={14} />
          Nuevo Medio
        </button>
      </div>

      {pressFlashes.length === 0 ? (
        <div className="glass border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-white/40 text-sm">No hay gacetillas disponibles.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pressFlashes.map((flash) => {
            const info = enviosCount[flash.id]
            const mediaUrls = flash.media_urls || []
            return (
              <motion.div
                key={flash.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border border-white/5 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-white mb-0.5">{flash.titulo}</h2>
                    <span className="text-[10px] text-white/40">
                      {format(new Date(flash.created_at), 'd MMMM, yyyy', { locale: es })}
                    </span>
                    <p className="text-white/70 text-sm leading-snug whitespace-pre-wrap mt-2 line-clamp-4">
                      {flash.texto_medios}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSendModal(flash)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      <Send size={12} />
                      Enviar a Medios
                    </button>

                    {info && info.count > 0 && (
                      <button
                        onClick={async () => {
                          const logs = await getGacetillaEnviosHistory(flash.id) as PrensaEnvioLog[]
                          setHistoryModal({ flash, logs })
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/10 text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        <Clock size={12} />
                        Enviado a {info.count} medio{info.count !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>

                {mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                    {mediaUrls.map((url, i) => {
                      const isImage = !isVideoUrl(url)
                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 text-[10px] transition-all"
                        >
                          <Download size={10} />
                          {isImage ? `Imagen ${i + 1}` : `Video ${i + 1}`}
                        </a>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {showForm && (
        <MedioForm medio={null} onClose={() => { setShowForm(false); loadPressFlashes() }} />
      )}

      {sendModal && (
        <SendGacetillaModal
          newsFlashId={sendModal.id}
          titulo={sendModal.titulo}
          textoMedios={sendModal.texto_medios}
          onClose={() => setSendModal(null)}
          onSuccess={() => {
            loadPressFlashes()
          }}
        />
      )}

      {historyModal && (
        <PrensaEnviosHistoryModal
          newsFlashId={historyModal.flash.id}
          titulo={historyModal.flash.titulo}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  )
}
