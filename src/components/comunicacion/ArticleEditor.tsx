'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  X, 
  CheckCircle2, 
  Loader2, 
  Type, 
  Eye,
  Send,
  Trash2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateArticleDraftAction, publishArticleAction } from '@/app/dashboard/comunicacion/actions'

export function ArticleEditor({ member }: { member: any }) {
  const [rawFacts, setRawFacts] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<{ url: string; type: string; name: string }[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [step, setStep] = useState(1) // 1: Input, 2: Preview & Edit
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0)

  useEffect(() => {
    if (step === 2 && media.length > 1) {
      const interval = setInterval(() => {
        setCurrentMediaIdx(prev => (prev + 1) % media.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [step, media.length])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // ─── Manejo de archivos ───
  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    
    setIsGenerating(true) // Usamos el loader general para indicar actividad
    const newMedia = []

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`
        const filePath = `${member.id}/${fileName}`

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
    setIsGenerating(false)
  }

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  // ─── Lógica IA ───
  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await generateArticleDraftAction(rawFacts)
      if (res.success && res.draft) {
        setTitle(res.draft.title)
        setContent(res.draft.content)
        setStep(2)
      } else {
        alert('Error: ' + res.error)
      }
    } catch (err) {
      alert('Error al generar el artículo')
    } finally {
      setIsGenerating(false)
    }
  }

  // ─── Publicación ───
  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const res = await publishArticleAction({
        title,
        content,
        media_urls: media.map(m => m.url), // En real usaríamos las URLs de storage
        is_published: true
      })
      if (res.success) {
        alert('Artículo publicado con éxito!')
        setStep(1)
        setRawFacts('')
        setMedia([])
      } else {
        alert('Error al publicar: ' + res.error)
      }
    } catch (err) {
      alert('Error en la publicación')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      
      {/* ─── LADO IZQUIERDO: INPUT & FORM ─── */}
      <div className="space-y-8">
        <div className="glass border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Type className="text-blue-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Entrada de Hechos</h2>
          </div>

          <textarea
            value={rawFacts}
            onChange={(e) => setRawFacts(e.target.value)}
            placeholder="Ej: 'Inauguramos el laboratorio de Robótica. Hubo 50 personas. El intendente cortó la cinta. Los chicos mostraron un brazo mecánico...'"
            className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/40 transition-all resize-none"
          />

          {/* Drag & Drop Zone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
              ${dragActive ? 'bg-blue-500/10 border-blue-500/40 scale-[1.02]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}
            `}
          >
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={(e) => handleFiles(e.target.files)}
              accept="image/*,video/*"
            />
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Upload className="text-[var(--text-muted)]" size={20} />
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">
              <span className="text-blue-400 font-bold">Cargá imágenes o videos</span><br />
              o arrastralos aquí
            </p>
          </div>

          {/* Media Preview Grid */}
          {media.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              <AnimatePresence>
                {media.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-xl overflow-hidden border border-white/10"
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <Video className="text-white/20" size={24} />
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeMedia(idx) }}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || rawFacts.length < 10}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-30 shadow-xl shadow-blue-900/20"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Redactando con Gemini...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generar Artículo de Impacto
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── LADO DERECHO: VISTA PREVIA & EDICIÓN FINAL ─── */}
      <div className="space-y-8 sticky top-8">
        <div className="glass border border-white/5 rounded-3xl p-8 space-y-8 min-h-[600px] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Eye className="text-purple-400" size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Vista Previa</h2>
            </div>
            {step === 2 && (
              <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Borrador IA</span>
            )}
          </div>

          <div className="flex-1 space-y-6">
            {step === 1 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale p-10 space-y-4">
                <Sparkles size={48} className="text-white/10" />
                <p className="text-sm text-white/40 italic">
                  Ingresá los hechos a la izquierda para que la IA <br />
                  pueda redactar tu próxima historia.
                </p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Title Editor */}
                <div className="group relative">
                  <span className="absolute -top-6 left-0 text-[10px] uppercase font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Título del Artículo (Editable)</span>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-3xl font-black text-white bg-white/[0.03] border-b-2 border-white/5 w-full focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.05] p-2 rounded-t-xl transition-all tracking-tight"
                  />
                </div>

                {/* Multimedia Slider */}
                {media.length > 0 && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video bg-black/40">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentMediaIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                      >
                        {media[currentMediaIdx].type === 'image' ? (
                          <img 
                            src={media[currentMediaIdx].url} 
                            className="w-full h-full object-cover" 
                            alt={`Preview ${currentMediaIdx}`}
                          />
                        ) : (
                          <video 
                            src={media[currentMediaIdx].url} 
                            className="w-full h-full object-cover"
                            autoPlay 
                            muted 
                            loop 
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Dots indicator */}
                    {media.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 backdrop-blur-sm p-2 rounded-full border border-white/5">
                        {media.map((_, i) => (
                          <div 
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === currentMediaIdx ? 'bg-blue-400 w-4' : 'bg-white/20'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Content Editor */}
                <div className="group relative flex-1">
                  <span className="absolute -top-6 left-0 text-[10px] uppercase font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Contenido del Artículo (Editable)</span>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[400px] bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-[var(--text-secondary)] text-sm leading-relaxed focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.04] transition-all font-serif"
                  />
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl border border-white/5 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex-[2] py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                  >
                    {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Publicar Ahora
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
