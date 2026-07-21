'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Type, 
  Eye,
  Users,
  Building2,
  Newspaper,
  Globe,
  CheckSquare,
  Square,
  X,
  CheckCircle,
  Upload,
  Video,
  ImageIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { NewsFlashMulticanal } from '@/services/news'

interface MulticanalResult {
  titulo: string
  texto_publico: string
  texto_miembros: string
  texto_sponsors: string
  texto_medios: string
}

interface MediaItem {
  url: string
  type: 'image' | 'video'
  name: string
}

interface NewsFlashMulticanalEditorProps {
  onSave: (data: {
    titulo: string
    datos_crudos: string
    texto_publico: string
    texto_miembros: string
    texto_sponsors: string
    texto_medios: string
    para_publico: boolean
    para_miembros: boolean
    para_sponsors: boolean
    para_medios: boolean
    media_urls?: string[]
  }) => Promise<{ success?: boolean; error?: string | null }>
  onCancel?: () => void
}

export function NewsFlashMulticanalEditor({ onSave, onCancel }: NewsFlashMulticanalEditorProps) {
  const [rawFacts, setRawFacts] = useState('')
  const [result, setResult] = useState<MulticanalResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'publico' | 'miembros' | 'sponsors' | 'medios'>('preview')
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  
  // Checkboxes de destinatarios
  const [paraPublico, setParaPublico] = useState(true)
  const [paraMiembros, setParaMiembros] = useState(true)
  const [paraSponsors, setParaSponsors] = useState(true)
  const [paraMedios, setParaMedios] = useState(true)

  const handleProcess = async () => {
    setErrorBanner(null)
    if (!rawFacts.trim() || rawFacts.length < 20) {
      alert('Ingresá al menos 20 caracteres en las notas crudas')
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch('/api/news/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos_crudos: rawFacts })
      })

      const data = await res.json()
      
      if (data.success && data.result) {
        setResult(data.result)
        setActiveTab('preview')
      } else {
        setErrorBanner(data.error || 'Error desconocido al procesar con IA')
      }
    } catch (err: any) {
      setErrorBanner('Error de conexión: ' + (err.message || 'Verifique su conexión'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = async () => {
    if (!result) {
      setErrorBanner('Procesá las notas con IA antes de guardar')
      return
    }

    setIsSaving(true)
    setErrorBanner(null)
    
    try {
      const res = await onSave({
        titulo: result.titulo,
        datos_crudos: rawFacts,
        texto_publico: result.texto_publico,
        texto_miembros: result.texto_miembros,
        texto_sponsors: result.texto_sponsors,
        texto_medios: result.texto_medios,
        para_publico: paraPublico,
        para_miembros: paraMiembros,
        para_sponsors: paraSponsors,
        para_medios: paraMedios,
        media_urls: media.map(m => m.url)
      })

      if (res?.error) {
        setErrorBanner(res.error)
      } else {
        setSuccessBanner('Noticia publicada exitosamente en los muros')
        setTimeout(() => {
          setSuccessBanner(null)
          onCancel?.()
        }, 3000)
      }
    } catch (err: any) {
      setErrorBanner('Error al guardar en base de datos: ' + (err.message || 'Error desconocido'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    
    const newMedia: MediaItem[] = []
    
    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `news-multicanal/${fileName}`
        
        const { data, error } = await supabase.storage
          .from('article-media')
          .upload(filePath, file)
        
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('article-media')
          .getPublicUrl(filePath)
        
        newMedia.push({
          url: publicUrl,
          type: file.type.startsWith('video') ? 'video' : 'image',
          name: file.name
        })
      } catch (err: any) {
        console.error('Error subiendo archivo:', err.message)
        alert('Error subiendo: ' + file.name)
      }
    }
    
    setMedia(prev => [...prev, ...newMedia])
  }

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const tabs = [
    { id: 'preview', label: 'Previsualización', icon: Eye, disabled: !result },
    { id: 'publico', label: 'Público', icon: Globe },
    { id: 'miembros', label: 'Miembros', icon: Users },
    { id: 'sponsors', label: 'Sponsors', icon: Building2 },
    { id: 'medios', label: 'Medios', icon: Newspaper },
  ]

  return (
    <div className="space-y-6">
      {/* Banner de Error */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
          >
            <X size={18} className="flex-shrink-0" />
            <span className="text-sm font-medium">{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner de Éxito */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400"
          >
            <CheckCircle size={18} className="flex-shrink-0" />
            <span className="text-sm font-medium">{successBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Type className="text-blue-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Notas Crudas del Evento</h2>
        </div>

        <textarea
          value={rawFacts}
          onChange={(e) => setRawFacts(e.target.value)}
          placeholder="Ej: 'Hoy inauguramos el laboratorio de Robótica con 30 estudiantes, el intendente cortó la cinta, los chicos mostraron un brazo mecánico controlado por IA...'"
          className="w-full min-h-[150px] bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/40 transition-all resize-none"
        />

        {/* Checkboxes de Destinatarios */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Destinatarios</h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setParaPublico(!paraPublico)} className="text-blue-400">
                {paraPublico ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm text-white">Público General</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setParaMiembros(!paraMiembros)} className="text-emerald-400">
                {paraMiembros ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm text-white">Miembros</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setParaSponsors(!paraSponsors)} className="text-amber-400">
                {paraSponsors ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm text-white">Sponsors</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setParaMedios(!paraMedios)} className="text-purple-400">
                {paraMedios ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm text-white">Medios</span>
            </label>
          </div>
        </div>

        {/* Subida de Media */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Imágenes / Videos del Evento</h3>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-2 rounded-xl border border-dashed border-white/20 text-white/60 text-xs font-medium hover:border-blue-500/40 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Click para seleccionar imágenes o videos
            </button>
            
            {media.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {media.map((item, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/10">
                    {item.type === 'video' ? (
                      <video src={item.url} className="w-full h-24 object-cover" />
                    ) : (
                      <img src={item.url} alt={item.name} className="w-full h-24 object-cover" />
                    )}
                    <button
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleProcess}
          disabled={isProcessing || rawFacts.length < 20}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-30 shadow-xl"
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Procesando con IA...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Procesar con IA
            </>
          )}
        </button>
      </div>

      {/* Resultado en Tabs */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/5 rounded-3xl overflow-hidden"
          >
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 p-2 bg-white/[0.02] border-b border-white/5">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    disabled={tab.disabled}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-30 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {activeTab === 'preview' && (
                <div className="space-y-6 min-h-[200px]">
                  <p className="text-xs text-white/40">Previsualización - Editá abajo antes de guardar</p>
                  
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">Título Generado por IA</h4>
                    <p className="text-lg font-bold text-white mb-4">{result.titulo}</p>
                  </div>
                  
                  {paraPublico && (
                    <div>
                      <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Público</h4>
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{result.texto_publico}</p>
                    </div>
                  )}
                  
                  {paraMiembros && (
                    <div>
                      <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Miembros</h4>
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{result.texto_miembros}</p>
                    </div>
                  )}
                  
                  {paraSponsors && (
                    <div>
                      <h4 className="text-xs font-bold text-amber-400 uppercase mb-2">Sponsors</h4>
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{result.texto_sponsors}</p>
                    </div>
                  )}
                  
                  {paraMedios && (
                    <div>
                      <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">Medios</h4>
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{result.texto_medios}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'publico' && (
                <textarea
                  value={result.texto_publico}
                  onChange={(e) => setResult({...result, texto_publico: e.target.value})}
                  className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/40"
                  placeholder="Texto para público general..."
                />
              )}

              {activeTab === 'miembros' && (
                <textarea
                  value={result.texto_miembros}
                  onChange={(e) => setResult({...result, texto_miembros: e.target.value})}
                  className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500/40"
                  placeholder="Texto para miembros..."
                />
              )}

              {activeTab === 'sponsors' && (
                <textarea
                  value={result.texto_sponsors}
                  onChange={(e) => setResult({...result, texto_sponsors: e.target.value})}
                  className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/40"
                  placeholder="Texto para sponsors..."
                />
              )}

              {activeTab === 'medios' && (
                <textarea
                  value={result.texto_medios}
                  onChange={(e) => setResult({...result, texto_medios: e.target.value})}
                  className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500/40"
                  placeholder="Gacetilla periodística..."
                />
              )}
            </div>

            {/* Acciones */}
            <div className="p-6 border-t border-white/5 flex gap-3">
              {onCancel && (
                <button onClick={onCancel} disabled={isSaving} className="flex-1 py-3 rounded-xl border border-white/5 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-30">
                  Cancelar
                </button>
              )}
              <button onClick={handleSave} disabled={isSaving || !result} className="flex-[2] py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-30">
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Guardar y Publicar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}