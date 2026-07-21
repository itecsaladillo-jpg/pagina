'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Users, Building2, Newspaper, ChevronDown, ChevronRight, Calendar, Eye, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { NewsFlashMulticanal } from '@/services/news'

interface NotasMulticanalListProps {
  notas: NewsFlashMulticanal[]
}

export function NotasMulticanalList({ notas }: NotasMulticanalListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeVariant, setActiveVariant] = useState<'publico' | 'miembros' | 'sponsors' | 'medios'>('publico')

  const selected = notas.find((n) => n.id === selectedId)

  const getVariantInfo = (nota: NewsFlashMulticanal) => [
    { key: 'publico' as const, label: 'Público', icon: Globe, color: 'text-blue-400', border: 'border-blue-500/30', text: nota.texto_publico, enabled: nota.para_publico },
    { key: 'miembros' as const, label: 'Miembros', icon: Users, color: 'text-emerald-400', border: 'border-emerald-500/30', text: nota.texto_miembros, enabled: nota.para_miembros },
    { key: 'sponsors' as const, label: 'Sponsors', icon: Building2, color: 'text-amber-400', border: 'border-amber-500/30', text: nota.texto_sponsors, enabled: nota.para_sponsors },
    { key: 'medios' as const, label: 'Medios', icon: Newspaper, color: 'text-purple-400', border: 'border-purple-500/30', text: nota.texto_medios, enabled: nota.para_medios },
  ]

  return (
    <div className="glass border border-white/5 rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FileText className="text-cyan-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Noticias Multicanal Guardadas</h2>
            <p className="text-xs text-white/40">{notas.length} noticias publicadas</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
        <div className={`${selectedId ? 'lg:w-1/3' : 'lg:w-full'} max-h-[500px] overflow-y-auto`}>
          {notas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/30 text-sm">No hay noticias multicanal guardadas aún</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notas.map((nota) => (
                <button
                  key={nota.id}
                  onClick={() => {
                    setSelectedId(selectedId === nota.id ? null : nota.id)
                    setActiveVariant('publico')
                  }}
                  className={`w-full text-left p-4 transition-all flex items-center gap-3 hover:bg-white/[0.02] ${
                    selectedId === nota.id ? 'bg-white/[0.03] border-l-2 border-cyan-500' : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{nota.titulo}</p>
                    <p className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />
                      {format(new Date(nota.created_at), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {nota.para_publico && <Globe size={10} className="text-blue-400" />}
                    {nota.para_miembros && <Users size={10} className="text-emerald-400" />}
                    {nota.para_sponsors && <Building2 size={10} className="text-amber-400" />}
                    {nota.para_medios && <Newspaper size={10} className="text-purple-400" />}
                  </div>
                  <ChevronRight
                    size={14}
                    className={`text-white/30 transition-transform ${selectedId === nota.id ? 'rotate-90' : ''}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">{selected.titulo}</h3>

              <div className="flex flex-wrap gap-2 mb-6">
                {getVariantInfo(selected).map((v) => {
                  const Icon = v.icon
                  if (!v.enabled) return null
                  return (
                    <button
                      key={v.key}
                      onClick={() => setActiveVariant(v.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
                        activeVariant === v.key
                          ? `${v.color} ${v.border} bg-white/[0.04]`
                          : 'text-white/30 border-transparent hover:text-white/60'
                      }`}
                    >
                      <Icon size={12} />
                      {v.label}
                    </button>
                  )
                })}
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                    {getVariantInfo(selected).find((v) => v.key === activeVariant)?.text || 'Sin contenido'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
