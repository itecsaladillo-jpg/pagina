'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Loader2, Clock, User, Mail } from 'lucide-react'
import { getGacetillaEnviosHistory } from '@/app/dashboard/prensa/actions'
import type { PrensaEnvioLog } from '@/types/database'

interface PrensaEnviosHistoryModalProps {
  newsFlashId: string
  titulo: string
  onClose: () => void
}

export function PrensaEnviosHistoryModal({ newsFlashId, titulo, onClose }: PrensaEnviosHistoryModalProps) {
  const [logs, setLogs] = useState<PrensaEnvioLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGacetillaEnviosHistory(newsFlashId).then(data => {
      setLogs(data as PrensaEnvioLog[])
      setLoading(false)
    })
  }, [newsFlashId])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 0.95 }}
        className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Clock size={16} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Historial de Envíos</h2>
              <p className="text-white/40 text-[10px] truncate max-w-xs">{titulo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-white/30 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <Mail size={32} className="mb-3" />
              <p className="text-sm font-medium">Sin envíos registrados</p>
              <p className="text-xs mt-1">Esta gacetilla aún no fue enviada a ningún medio</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]"
              >
                {log.status === 'enviado' ? (
                  <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-xs font-medium truncate">{log.medio_nombre}</p>
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                      log.status === 'enviado'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {log.status === 'enviado' ? 'Enviado' : 'Fallido'}
                    </span>
                  </div>
                  <p className="text-white/40 text-[10px] truncate mt-0.5">{log.recipient_email}</p>
                  {log.error_message && (
                    <p className="text-red-400/60 text-[10px] mt-1 truncate">{log.error_message}</p>
                  )}
                  <p className="text-white/20 text-[9px] mt-1.5 flex items-center gap-1">
                    <User size={8} />
                    <span>{formatDate(log.created_at)}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
