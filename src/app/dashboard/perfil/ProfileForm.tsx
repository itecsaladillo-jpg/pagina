'use client'

import { useState, useRef } from 'react'
import { updateProfileAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import { User, Phone, Mail, BookOpen, Briefcase, Quote, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  member: any
}

export function ProfileForm({ member }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setUploading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${member.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Subir archivo al bucket de Supabase Storage 'avatars'
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: 'Foto de perfil subida con éxito (recordá guardar los cambios).' })
    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      setMessage({ 
        type: 'error', 
        text: `No se pudo subir la foto de perfil: ${err.message || 'Bucket "avatars" no configurado en Supabase.'}` 
      })
    } finally {
      setUploading(false)
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
          onChange={handleAvatarUpload} 
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
    </div>
  )
}
