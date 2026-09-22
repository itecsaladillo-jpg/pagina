'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { sendGacetillaToMedios, getActiveMediosPrensa } from '@/app/dashboard/prensa/actions'

interface MedioItem {
  id: string
  nombre_medio: string
  tipo_medio: string
  email: string
  nombre_contacto: string | null
  apellido_contacto: string | null
}

interface SendGacetillaModalProps {
  newsFlashId: string
  titulo: string
  textoMedios: string
  onClose: () => void
  onSuccess: () => void
}

export function SendGacetillaModal({ newsFlashId, titulo, textoMedios, onClose, onSuccess }: SendGacetillaModalProps) {
  const [medios, setMedios] = useState<MedioItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [step, setStep] = useState<'select' | 'sending' | 'result'>('select')
  const [result, setResult] = useState<{ enviados: number; fallidos: number; results: any[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveMediosPrensa().then(data => {
      setMedios(data as MedioItem[])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return medios
    const q = search.toLowerCase()
    return medios.filter(m =>
      m.nombre_medio.toLowerCase().includes(q) ||
      m.tipo_medio.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  }, [medios, search])

  const toggleAll = () => {
    if (filtered.length === 0) return
    const allSelected = filtered.every(m => selectedIds.has(m.id))
    if (allSelected) {
      const next = new Set(selectedIds)
      filtered.forEach(m => next.delete(m.id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      filtered.forEach(m => next.add(m.id))
      setSelectedIds(next)
    }
  }

  const toggle = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSend = async () => {
    setStep('sending')
    const res = await sendGacetillaToMedios({ newsFlashId, selectedMediosIds: Array.from(selectedIds) })
    setResult({ enviados: res.enviados ?? 0, fallidos: res.fallidos ?? 0, results: res.results ?? [] })
    setStep('result')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Mail size={16} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Enviar Gacetilla a Medios</h2>
              <p className="text-white/40 text-[10px] truncate max-w-md">{titulo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        {step === 'select' && (
          <>
            {/* Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left: Media List */}
              <div className="md:w-1/2 border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar medio..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500/40 placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every(m => selectedIds.has(m.id))}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/5"
                    />
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                      {filtered.every(m => selectedIds.has(m.id)) && filtered.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </span>
                  </label>
                  <span className="text-[10px] text-white/30 ml-auto">{selectedIds.size} de {medios.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="text-white/30 animate-spin" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/30">
                      <Mail size={28} className="mb-2" />
                      <p className="text-xs">No se encontraron medios</p>
                    </div>
                  ) : (
                    filtered.map(medio => (
                      <label
                        key={medio.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-all border-b border-white/5 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(medio.id)}
                          onChange={() => toggle(medio.id)}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{medio.nombre_medio}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <span>{medio.tipo_medio}</span>
                            <span>·</span>
                            <span className="truncate">{medio.email}</span>
                          </div>
                        </div>
                        {medio.nombre_contacto && (
                          <span className="text-[10px] text-white/30 hidden sm:block truncate max-w-[100px]">
                            {medio.nombre_contacto} {medio.apellido_contacto || ''}
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Preview */}
              <div className="md:w-1/2 flex flex-col">
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[9px] font-bold uppercase tracking-wider border border-purple-500/20">
                      Vista previa
                    </span>
                    <span className="text-[10px] text-white/30">Plantilla institucional ITEC</span>
                  </div>
                  <h3 className="text-white text-sm font-bold leading-snug">{titulo}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                      {textoMedios}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
              <p className="text-xs text-white/50">
                {selectedIds.size === 0
                  ? 'Seleccioná al menos un medio'
                  : `Se enviará a ${selectedIds.size} medio${selectedIds.size !== 1 ? 's' : ''} seleccionado${selectedIds.size !== 1 ? 's' : ''}`}
              </p>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={selectedIds.size === 0}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 disabled:text-white/30 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <Send size={12} />
                  Confirmar y Enviar
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'sending' && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-purple-400 animate-spin" />
            <p className="text-white font-semibold text-sm">Enviando gacetilla vía Resend...</p>
            <p className="text-white/40 text-xs">Enviando a {selectedIds.size} medio{selectedIds.size !== 1 ? 's' : ''}</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-5 px-6">
            {result.fallidos === 0 ? (
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-400" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertCircle size={32} className="text-amber-400" />
              </div>
            )}

            <div className="text-center">
              <h3 className="text-white font-bold text-lg mb-1">
                {result.fallidos === 0 ? 'Gacetilla enviada con éxito' : 'Envío completado con errores'}
              </h3>
              <p className="text-white/50 text-xs">Resultado del envío a medios de prensa</p>
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-green-400 text-2xl font-bold">{result.enviados}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Enviados</p>
              </div>
              {result.fallidos > 0 && (
                <div className="text-center">
                  <p className="text-red-400 text-2xl font-bold">{result.fallidos}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Fallidos</p>
                </div>
              )}
            </div>

            {result.fallidos > 0 && (
              <div className="w-full max-w-md space-y-1.5">
                {result.results.filter(r => r.status === 'fallido').map((r, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <AlertCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-medium truncate">{r.medioNombre}</p>
                      <p className="text-red-400/60 text-[10px] truncate">{r.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { onSuccess(); onClose() }}
              className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              {result.fallidos === 0 ? 'Cerrar' : 'Cerrar y Revisar'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
