'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Users, Building2, Newspaper, ChevronRight, Calendar, FileText, Save, Loader2, Upload, CheckCircle, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { updateNotaAction, deleteNotaAction, swapNotasOrderAction } from '@/app/dashboard/comunicacion/actions'
import type { NewsFlashMulticanal } from '@/services/news'
import { toUtcLocalDate } from '@/lib/dates'

interface NotasMulticanalListProps {
  notas: NewsFlashMulticanal[]
}

function getMediaArray(nota: NewsFlashMulticanal | undefined): string[] {
  if (!nota) return []
  const m = (nota as any).media_urls
  if (Array.isArray(m)) return m
  if (typeof m === 'string') {
    try { return JSON.parse(m) } catch { return [] }
  }
  return []
}

export function NotasMulticanalList({ notas: initialNotas }: NotasMulticanalListProps) {
  const [notas, setNotas] = useState(initialNotas)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeVariant, setActiveVariant] = useState<'publico' | 'miembros' | 'sponsors' | 'medios'>('publico')
  const [editContent, setEditContent] = useState<Record<string, string>>({})
  const [localMedia, setLocalMedia] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Sincronizar estado local si cambian los props (cuando Next.js invalida la cache)
  useEffect(() => {
    setNotas(initialNotas)
  }, [initialNotas])

  const selected = notas.find((n) => n.id === selectedId)

  const allMediaUrls: string[] = (() => {
    if (!selected) return []
    const stored = getMediaArray(selected)
    const local = localMedia[selected.id] ?? []
    // Combina las guardadas con las nuevas subidas en la sesión, sin duplicar
    const combined = [...stored]
    for (const url of local) {
      if (!combined.includes(url)) combined.push(url)
    }
    return combined
  })()
  const getTextKey = (notaId: string, variant: string) => `${notaId}-${variant}`

  const getCurrentContent = (nota: NewsFlashMulticanal) => {
    const key = getTextKey(nota.id, activeVariant)
    if (editContent[key] !== undefined) return editContent[key]
    switch (activeVariant) {
      case 'publico': return nota.texto_publico
      case 'miembros': return nota.texto_miembros
      case 'sponsors': return nota.texto_sponsors
      case 'medios': return nota.texto_medios
    }
  }

  const getVariantInfo = (nota: NewsFlashMulticanal) => [
    { key: 'publico' as const, label: 'Público', icon: Globe, color: 'text-blue-400', border: 'border-blue-500/30', enabled: nota.para_publico },
    { key: 'miembros' as const, label: 'Miembros', icon: Users, color: 'text-emerald-400', border: 'border-emerald-500/30', enabled: nota.para_miembros },
    { key: 'sponsors' as const, label: 'Sponsors', icon: Building2, color: 'text-amber-400', border: 'border-amber-500/30', enabled: nota.para_sponsors },
    { key: 'medios' as const, label: 'Medios', icon: Newspaper, color: 'text-purple-400', border: 'border-purple-500/30', enabled: nota.para_medios },
  ]

  const handleSelect = (nota: NewsFlashMulticanal) => {
    const id = selectedId === nota.id ? null : nota.id
    setSelectedId(id)
    setActiveVariant('publico')
    setSuccessMsg(null)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('¿Estás seguro de eliminar esta noticia multicanal?')) return
    
    setNotas(prev => prev.filter(n => n.id !== id))
    
    startTransition(async () => {
      try {
        const res = await deleteNotaAction(id)
        if (res && res.error) {
          alert('Error al eliminar: ' + res.error)
          setNotas(initialNotas)
        } else {
          if (selectedId === id) setSelectedId(null)
        }
      } catch (err: any) {
        alert('Error inesperado: ' + err.message)
        setNotas(initialNotas)
      }
    })
  }

  const handleMoveUp = async (e: React.MouseEvent, idx: number) => {
    e.stopPropagation()
    if (idx === 0) return
    
    const newNotas = [...notas]
    const temp = newNotas[idx]
    newNotas[idx] = newNotas[idx - 1]
    newNotas[idx - 1] = temp
    setNotas(newNotas)
    
    startTransition(async () => {
      try {
        const res = await swapNotasOrderAction(initialNotas[idx].id, initialNotas[idx - 1].id)
        if (res && res.error) {
          alert('Error al mover: ' + res.error)
          setNotas(initialNotas)
        }
      } catch (err: any) {
        alert('Error inesperado: ' + err.message)
        setNotas(initialNotas)
      }
    })
  }

  const handleMoveDown = async (e: React.MouseEvent, idx: number) => {
    e.stopPropagation()
    if (idx === notas.length - 1) return
    
    const newNotas = [...notas]
    const temp = newNotas[idx]
    newNotas[idx] = newNotas[idx + 1]
    newNotas[idx + 1] = temp
    setNotas(newNotas)
    
    startTransition(async () => {
      try {
        const res = await swapNotasOrderAction(initialNotas[idx].id, initialNotas[idx + 1].id)
        if (res && res.error) {
          alert('Error al mover: ' + res.error)
          setNotas(initialNotas)
        }
      } catch (err: any) {
        alert('Error inesperado: ' + err.message)
        setNotas(initialNotas)
      }
    })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || !selectedId || !selected) return
    const currentUrls = getMediaArray(selected)

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `news-multicanal/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const { error } = await supabase.storage.from('article-media').upload(fileName, file)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('article-media').getPublicUrl(fileName)
        currentUrls.push(publicUrl)
      } catch (err: any) {
        console.error('Error subiendo archivo:', err.message)
      }
    }

    setLocalMedia(prev => ({ ...prev, [selectedId]: currentUrls }))
  }

  const removeMedia = (url: string) => {
    if (!selectedId || !selected) return
    const current = localMedia[selectedId] ?? getMediaArray(selected)
    setLocalMedia(prev => ({ ...prev, [selectedId]: current.filter(u => u !== url) }))
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(selected.id)
    setSuccessMsg(null)

    const variants = ['publico', 'miembros', 'sponsors', 'medios'] as const
    let hasError = false

    for (const variant of variants) {
      const key = getTextKey(selected.id, variant)
      const content = editContent[key] !== undefined
        ? editContent[key]
        : variant === 'publico' ? selected.texto_publico
        : variant === 'miembros' ? selected.texto_miembros
        : variant === 'sponsors' ? selected.texto_sponsors
        : selected.texto_medios

      const res = await updateNotaAction({
        newsFlashId: selected.id,
        variant,
        contenido: content,
        media_urls: variant === 'publico' ? allMediaUrls : undefined,
      })

      if (res && !res.success) {
        hasError = true
      }
    }

    setSaving(null)
    if (!hasError) {
      setSuccessMsg('Las 4 versiones fueron guardadas')
      setTimeout(() => setSuccessMsg(null), 3000)
    }
  }

  return (
    <div className="glass border border-white/5 rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FileText className="text-cyan-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Noticias Multicanal Guardadas</h2>
            <p className="text-xs text-white/40">{notas.length} noticias publicadas {isPending && '(Actualizando...)'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
        <div className={`${selectedId ? 'lg:w-1/3' : 'lg:w-full'} max-h-[600px] overflow-y-auto`}>
          {notas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/30 text-sm">No hay noticias multicanal guardadas aún</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notas.map((nota, idx) => (
                <button
                  key={nota.id}
                  onClick={() => handleSelect(nota)}
                  className={`w-full text-left p-4 transition-all flex items-center gap-3 hover:bg-white/[0.02] ${
                    selectedId === nota.id ? 'bg-white/[0.03] border-l-2 border-cyan-500' : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{nota.titulo}</p>
                    <p className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />
                      {format(toUtcLocalDate(nota.created_at), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  
                  {/* Controles de Acción (Orden y Borrar) */}
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col gap-1">
                      <div
                        onClick={(e) => handleMoveUp(e, idx)}
                        className={`p-1 rounded transition-colors ${idx === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
                      >
                        <ArrowUp size={12} />
                      </div>
                      <div
                        onClick={(e) => handleMoveDown(e, idx)}
                        className={`p-1 rounded transition-colors ${idx === notas.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
                      >
                        <ArrowDown size={12} />
                      </div>
                    </div>
                    
                    <div
                      onClick={(e) => handleDelete(e, nota.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-red-500/60 hover:text-red-400 transition-colors ml-1"
                      title="Eliminar Noticia"
                    >
                      <Trash2 size={14} />
                    </div>
                  </div>

                  <ChevronRight
                    size={14}
                    className={`text-white/30 transition-transform ${selectedId === nota.id ? 'rotate-90' : ''} ml-2`}
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
              className="flex-1 p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-white">{selected.titulo}</h3>
                {selected.texto_publico && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`📢 *${selected.titulo}*\n\n${selected.texto_publico}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 hover:border-[#25d366]/40 text-[#25d366] text-xs font-semibold transition-all"
                    title="Compartir por WhatsApp"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.406A9.944 9.944 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.333-1.279l-.31-.184-3.118.88.846-3.048-.201-.313A7.954 7.954 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" />
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>

              {successMsg && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  <CheckCircle size={14} />
                  {successMsg}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {getVariantInfo(selected).map((v) => {
                  const Icon = v.icon
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

              <textarea
                value={getCurrentContent(selected)}
                onChange={(e) => setEditContent(prev => ({
                  ...prev,
                  [getTextKey(selected.id, activeVariant)]: e.target.value
                }))}
                className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white/80 focus:outline-none focus:border-cyan-500/40 transition-all resize-y leading-relaxed"
              />

              {/* Imágenes guardadas de la noticia */}
              {allMediaUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Imágenes de la noticia</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allMediaUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40">
                        {/\.(mp4|webm|mov)$/i.test(url) ? (
                          <video src={url} controls className="w-full h-32 object-contain" />
                        ) : (
                          <img
                            src={url}
                            alt={`Imagen ${idx + 1}`}
                            className="w-full h-32 object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                        <button
                          onClick={() => removeMedia(url)}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                          title="Eliminar imagen"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <span className="text-[10px] text-white/80 truncate block">
                            {url.match(/([^/]+?)(?:\?.*)?$/)?.[1] || 'archivo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Área de subida de nuevas imágenes */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 rounded-xl border border-dashed border-white/20 text-white/60 text-xs font-medium hover:border-cyan-500/40 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={14} />
                  Agregar imágenes o videos
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saving === selected.id}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                {saving === selected.id ? (
                  <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                ) : (
                  <><Save size={14} /> Guardar Cambios</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
