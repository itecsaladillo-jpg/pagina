'use client'

import { useState, useRef } from 'react'
import { updateProfileAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import { User, Phone, Mail, BookOpen, Briefcase, Quote, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  member: any
}

interface CropperModalProps {
  imageSrc: string
  onCrop: (blob: Blob) => void
  onCancel: () => void
}

function ImageCropperModal({ imageSrc, onCrop, onCancel }: CropperModalProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 })
  const [processing, setProcessing] = useState(false)
  
  const dragStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const wNat = img.naturalWidth
    const hNat = img.naturalHeight
    setImgDimensions({ width: wNat, height: hNat })
    
    const CONTAINER_SIZE = 280
    let wBase = CONTAINER_SIZE
    let hBase = CONTAINER_SIZE
    
    if (wNat > hNat) {
      hBase = CONTAINER_SIZE
      wBase = CONTAINER_SIZE * (wNat / hNat)
    } else {
      wBase = CONTAINER_SIZE
      hBase = CONTAINER_SIZE * (hNat / wNat)
    }
    
    setBaseSize({ width: wBase, height: hBase })
    setPosition({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    dragStart.current = {
      x: clientX - position.x,
      y: clientY - position.y
    }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || baseSize.width === 0) return
    
    const CONTAINER_SIZE = 280
    const wRender = baseSize.width * zoom
    const hRender = baseSize.height * zoom
    
    let newX = clientX - dragStart.current.x
    let newY = clientY - dragStart.current.y
    
    const minX = (CONTAINER_SIZE - wRender) / 2
    const maxX = (wRender - CONTAINER_SIZE) / 2
    const minY = (CONTAINER_SIZE - hRender) / 2
    const maxY = (hRender - CONTAINER_SIZE) / 2
    
    newX = Math.max(minX, Math.min(maxX, newX))
    newY = Math.max(minY, Math.min(maxY, newY))
    
    setPosition({ x: newX, y: newY })
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom)
    
    if (baseSize.width === 0) return
    const CONTAINER_SIZE = 280
    const wRender = baseSize.width * newZoom
    const hRender = baseSize.height * newZoom
    
    const minX = (CONTAINER_SIZE - wRender) / 2
    const maxX = (wRender - CONTAINER_SIZE) / 2
    const minY = (CONTAINER_SIZE - hRender) / 2
    const maxY = (hRender - CONTAINER_SIZE) / 2
    
    setPosition(prev => ({
      x: Math.max(minX, Math.min(maxX, prev.x)),
      y: Math.max(minY, Math.min(maxY, prev.y))
    }))
  }

  const handleSave = () => {
    setProcessing(true)
    setTimeout(() => {
      const img = new Image()
      img.src = imageSrc
      img.onload = () => {
        const CONTAINER_SIZE = 280
        const wRender = baseSize.width * zoom
        
        const xRel = position.x + (CONTAINER_SIZE - wRender) / 2
        const yRel = position.y + (CONTAINER_SIZE - baseSize.height * zoom) / 2
        
        const ratio = imgDimensions.width / wRender
        
        const xCropNat = -xRel * ratio
        const yCropNat = -yRel * ratio
        const wCropNat = CONTAINER_SIZE * ratio
        const hCropNat = CONTAINER_SIZE * ratio
        
        const canvas = document.createElement('canvas')
        canvas.width = 500
        canvas.height = 500
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          ctx.drawImage(
            img,
            xCropNat, yCropNat, wCropNat, hCropNat,
            0, 0, 500, 500
          )
          
          canvas.toBlob((blob) => {
            if (blob) {
              onCrop(blob)
            } else {
              setProcessing(false)
            }
          }, 'image/jpeg', 0.9)
        } else {
          setProcessing(false)
        }
      }
      img.onerror = () => {
        setProcessing(false)
      }
    }, 100)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center space-y-6">
        
        <div className="text-center space-y-1 w-full">
          <h3 className="text-lg font-bold text-white">Encuadrar Foto de Perfil</h3>
          <p className="text-xs text-zinc-400">Arrastrá para acomodar y deslizá para el zoom</p>
        </div>

        <div 
          ref={containerRef}
          className="relative w-[280px] h-[280px] rounded-full overflow-hidden bg-zinc-950 border-2 border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.2)] touch-none select-none flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              handleStart(e.touches[0].clientX, e.touches[0].clientY)
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1) {
              handleMove(e.touches[0].clientX, e.touches[0].clientY)
            }
          }}
          onTouchEnd={handleEnd}
        >
          <div className="absolute inset-0 rounded-full border border-black/10 pointer-events-none z-10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]" />

          <img
            src={imageSrc}
            alt="Preview"
            onLoad={handleImageLoad}
            className="max-w-none pointer-events-none select-none"
            style={{
              width: baseSize.width ? `${baseSize.width * zoom}px` : 'auto',
              height: baseSize.height ? `${baseSize.height * zoom}px` : 'auto',
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.05s ease-out'
            }}
          />
        </div>

        <div className="w-full space-y-2 px-2">
          <div className="flex justify-between text-xs text-zinc-400 font-medium">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-xs font-semibold">1x</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
            <span className="text-zinc-500 text-xs font-semibold">3x</span>
          </div>
        </div>

        <div className="flex items-center justify-end w-full gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={processing || baseSize.width === 0}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>Procesando...</span>
              </>
            ) : (
              <span>Aplicar Encuadre</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProfileForm({ member }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>('')
  
  const [formData, setFormData] = useState({
    full_name: member.full_name || '',
    email: member.email || '',
    phone: member.phone || '',
    bio: member.bio || '',
    avatar_url: member.avatar_url || '',
    linkedin_url: member.linkedin_url || '',
    frase_itec: member.frase_itec || '',
    tareas_itec: member.tareas_itec || '',
  })
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setOriginalFileName(file.name)
    
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCroppedUpload = async (blob: Blob) => {
    setUploading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const fileExt = originalFileName.split('.').pop() || 'jpg'
      const fileName = `${member.id}-${Date.now()}.${fileExt}`

      // Subir el blob recortado al bucket 'avatars'
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { 
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true 
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: 'Foto de perfil subida y encuadrada con éxito (recordá guardar los cambios).' })
    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      setMessage({ 
        type: 'error', 
        text: `No se pudo subir la foto de perfil: ${err.message || 'Bucket "avatars" no configurado en Supabase.'}` 
      })
    } finally {
      setUploading(false)
      setCropSrc(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await updateProfileAction(formData)
    if (res.success) {
      setMessage({ type: 'success', text: 'Perfil actualizado con éxito.' })
      // Hacer scroll suave hacia arriba para ver el mensaje
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al actualizar el perfil.' })
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Panel Izquierdo: Credencial Visual Premium */}
      <div className="lg:col-span-4 flex flex-col items-center p-6 rounded-3xl bg-zinc-950/40 border border-zinc-800/60 shadow-inner text-center h-fit space-y-6">
        <div className="relative group cursor-pointer" onClick={triggerFileInput}>
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-lg group-hover:border-indigo-400 transition-all flex items-center justify-center bg-zinc-900">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt={formData.full_name} className="w-full h-full object-cover" />
            ) : (
              <User size={64} className="text-zinc-650" />
            )}
          </div>
          {/* Overlay para indicar que se puede cambiar la foto */}
          <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
            <Camera size={14} />
            <span>Cambiar</span>
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/80 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-400" size={24} />
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="image/*" 
        />

        <div className="space-y-2 w-full">
          <h2 className="text-xl font-bold text-white leading-tight truncate px-2">{formData.full_name || 'Miembro ITEC'}</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {member.role || 'Miembro'}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {member.status || 'Activo'}
            </span>
          </div>
        </div>

        {/* Cita/Frase ITEC destacada */}
        <div className="pt-4 border-t border-zinc-800/80 w-full">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-black mb-2 flex items-center justify-center gap-1.5">
            <Quote size={10} className="text-indigo-400" /> Frase ITEC
          </p>
          <p className="text-sm italic text-zinc-300 px-4 leading-relaxed font-medium">
            {formData.frase_itec ? `"${formData.frase_itec}"` : '"Lo que representa ITEC para mí..."'}
          </p>
        </div>
      </div>

      {/* Panel Derecho: Inputs de edición */}
      <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold ml-1 flex items-center gap-1.5">
              <User size={12} className="text-zinc-550" /> Nombre y Apellido
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold ml-1 flex items-center gap-1.5">
              <Mail size={12} className="text-zinc-550" /> Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Teléfono */}
          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold ml-1 flex items-center gap-1.5">
              <Phone size={12} className="text-zinc-550" /> Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ej: +54 9 2344 123456"
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
            />
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold ml-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-550 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
              <span>LinkedIn</span>
            </label>
            <input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              placeholder="Ej: https://linkedin.com/in/usuario"
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
            />
          </div>
        </div>

        {/* Foto de Perfil URL (como fallback) */}
        <div className="space-y-2">
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold ml-1 flex items-center gap-1.5">
            <Camera size={12} className="text-zinc-550" /> Enlace de la Foto de Perfil (Opcional)
          </label>
          <input
            type="url"
            value={formData.avatar_url}
            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            placeholder="Ej: https://ejemplo.com/mi-foto.jpg (o cargá una foto desde la credencial de la izquierda)"
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
          />
        </div>

        {/* Frase personal ITEC */}
        <div className="space-y-2">
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold ml-1 flex items-center gap-1.5">
            <Quote size={12} className="text-zinc-550" /> Frase personal: ¿Qué te representa ITEC?
          </label>
          <input
            type="text"
            value={formData.frase_itec}
            onChange={(e) => setFormData({ ...formData, frase_itec: e.target.value })}
            maxLength={100}
            placeholder="Ej: ITEC es el espacio donde potenciamos el talento tecnológico local."
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
          />
          <p className="text-[var(--text-muted)] text-[10px] italic">
            * Límite de 100 caracteres. Esta frase se mostrará en tu credencial de miembro.
          </p>
        </div>

        {/* Tareas en ITEC */}
        <div className="space-y-2">
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold ml-1 flex items-center gap-1.5">
            <Briefcase size={12} className="text-zinc-550" /> Tus Tareas en ITEC
          </label>
          <textarea
            value={formData.tareas_itec}
            onChange={(e) => setFormData({ ...formData, tareas_itec: e.target.value })}
            rows={3}
            placeholder="Describí brevemente cuáles son tus tareas o responsabilidades dentro del equipo..."
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all resize-none"
          />
        </div>

        {/* Conocimientos y Habilidades (Bio) */}
        <div className="space-y-2">
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold ml-1 flex items-center gap-1.5">
            <BookOpen size={12} className="text-zinc-550" /> Conocimientos y Habilidades a disposición del equipo
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            placeholder="Escribí las habilidades técnicas, herramientas o conocimientos específicos que podés compartir con el equipo (ej: Arduino, soldadura SMD, desarrollo web, etc.)..."
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all resize-none"
          />
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center justify-center gap-2 cursor-pointer font-bold uppercase tracking-wider text-xs"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin text-white" size={16} />
              <span>Guardando cambios...</span>
            </>
          ) : (
            <span>Guardar Perfil ITEC</span>
          )}
        </button>
      </form>

      {cropSrc && (
        <ImageCropperModal
          imageSrc={cropSrc}
          onCrop={handleCroppedUpload}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  )
}
