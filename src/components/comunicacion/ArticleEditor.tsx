'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  X, 
  CheckCircle2, 
  Loader2, 
  Eye,
  Send,
  Trash2,
  Calendar,
  Zap,
  Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { publishArticleAction } from '@/app/dashboard/comunicacion/actions'

export function ArticleEditor({ member, initialArticle, onCancel }: { member: any; initialArticle?: any; onCancel?: () => void }) {
  const [title, setTitle] = useState(initialArticle?.title || '')
  const [content, setContent] = useState(initialArticle?.content || '')
  const [media, setMedia] = useState<{ url: string; type: string; name: string }[]>(
    initialArticle?.media_urls?.map((url: string) => ({ 
      url, 
      type: url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image', 
      name: 'Archivo' 
    })) || []
  )
  const [date, setDate] = useState(
    initialArticle?.created_at 
      ? new Date(initialArticle.created_at).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  )
  const [badgeText, setBadgeText] = useState(initialArticle?.excerpt || 'Impacto Regional')
  const [isPublishing, setIsPublishing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0)

  useEffect(() => {
    if (media.length > 1) {
      const interval = setInterval(() => {
        setCurrentMediaIdx(prev => (prev + 1) % media.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [media.length])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // ─── Manejo de archivos ───
  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    
    const newMedia: { url: string; type: string; name: string }[] = []

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
  }

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const setAsMain = (index: number) => {
    const newMedia = [...media]
    const item = newMedia.splice(index, 1)[0]
    newMedia.unshift(item)
    setMedia(newMedia)
  }

  // ─── Publicación ───
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Título y contenido son obligatorios')
      return
    }
    
    setIsPublishing(true)
    try {
      const res = await publishArticleAction({
        id: initialArticle?.id,
        title,
        content,
        media_urls: media.map(m => m.url),
        is_published: true,
        created_at: date,
        badge_text: badgeText
      })
      if (res.success) {
        alert(initialArticle ? 'Artículo actualizado con éxito!' : 'Artículo publicado con éxito!')
        if (onCancel) onCancel()
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
              <ImageIcon className="text-blue-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Editor de Artículo</h2>
          </div>

          {/* Título */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del artículo..."
            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-xl font-bold text-white focus:outline-none focus:border-blue-500/40 transition-all"
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
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors z-30"
                    >
                      <X size={12} />
                    </button>
                    {idx === 0 ? null : (
                      <button 
                        onClick={() => setAsMain(idx)}
                        className="absolute bottom-1 right-1 p-1 bg-black/60 rounded-full text-white/40 hover:text-yellow-400 hover:bg-black/80 transition-all z-30"
                        title="Marcar como principal"
                      >
                        <Star size={12} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenido del artículo..."
            className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/40 transition-all resize-none"
          />
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
            <div className="group relative flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:border-blue-500/30 transition-all">
              <Calendar size={14} className="text-blue-400" />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer w-24"
              />
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <span className="text-sm font-black text-white">{title || 'Sin título'}</span>
              <p className="text-[var(--text-secondary)] text-sm mt-2 leading-relaxed font-serif">
                {content || 'Sin contenido'}
              </p>
            </div>

            <div className="pt-8 flex gap-4">
              <button 
                onClick={() => {
                  if (initialArticle && onCancel) {
                    onCancel()
                  }
                }}
                className="flex-1 py-3 rounded-xl border border-white/5 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Cancelar
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
          </div>
        </div>
      </div>

    </div>
  )
}