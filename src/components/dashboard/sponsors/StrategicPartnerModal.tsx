'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Upload, Building2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createStrategicPartner, updateStrategicPartner } from '@/app/dashboard/sponsors/partner-actions'

const CATEGORIES = [
  { value: 'institucion_educativa', label: 'Institución Educativa' },
  { value: 'organismo_publico', label: 'Organismo Público' },
  { value: 'ong', label: 'ONG / Asociación' },
  { value: 'empresa_aliada', label: 'Empresa Aliada' },
  { value: 'otro', label: 'Otro' },
]

interface StrategicPartner {
  id: string
  name: string
  category: string | null
  actions_description: string
  logo_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Props {
  partner?: StrategicPartner | null
  onClose: () => void
  onCreated?: (partner: StrategicPartner) => void
  onUpdated?: (partner: StrategicPartner) => void
}

export function StrategicPartnerModal({ partner, onClose, onCreated, onUpdated }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(partner?.logo_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: partner?.name || '',
    category: partner?.category || '',
    actions_description: partner?.actions_description || '',
  })

  useEffect(() => {
    document.documentElement.classList.add('sponsor-form-open')
    return () => document.documentElement.classList.remove('sponsor-form-open')
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato no aceptado. Use PNG, JPG, WEBP o SVG.')
      return
    }

    // Validar tamaño (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('El archivo excede 2MB.')
      return
    }

    setError('')
    setUploading(true)

    try {
      // Crear preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Subir a Supabase Storage
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileExt = cleanName.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `institutional-logos/${fileName}`

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('sponsors-logos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('sponsors-logos')
        .getPublicUrl(filePath)

      setLogoPreview(urlData.publicUrl)
    } catch (err: any) {
      setError('Error al subir el logo: ' + err.message)
      setLogoPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('El nombre de la institución es requerido.')
      return
    }

    if (!form.actions_description.trim() || form.actions_description.trim().length < 10) {
      setError('La descripción de acciones debe tener al menos 10 caracteres.')
      return
    }

    if (!logoPreview) {
      setError('Debe subir el logo de la institución.')
      return
    }

    setLoading(true)

    try {
      const data = {
        name: form.name.trim(),
        category: (form.category || undefined) as 'institucion_educativa' | 'organismo_publico' | 'ong' | 'empresa_aliada' | 'otro' | undefined,
        actions_description: form.actions_description.trim(),
        logo_url: logoPreview,
      }

      if (partner) {
        const result = await updateStrategicPartner(partner.id, data)
        onUpdated?.(result.data)
      } else {
        const result = await createStrategicPartner(data)
        onCreated?.(result.data)
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar la institución.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[var(--accent-primary)] outline-none transition-colors"
  const labelClass = "block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                {partner ? 'Editar Institución' : 'Nueva Institución/Organismo'}
              </h3>
              <p className="text-[var(--text-muted)] text-xs">
                {partner ? 'Modificar datos de la entidad' : 'Agregar un nuevo socio estratégico'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Logo */}
          <div>
            <label className={labelClass}>Logo de la Institución *</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div
                className="w-24 h-24 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/20 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
                ) : logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-[var(--text-muted)]" />
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs text-[var(--accent-primary)] hover:underline disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                </button>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  PNG, JPG, WEBP o SVG. Máx 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className={labelClass}>Nombre de la Institución/Organismo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Universidad Nacional de La Pampa"
              className={inputClass}
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className={labelClass}>Tipo/Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              <option value="">— Seleccionar categoría —</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción de acciones */}
          <div>
            <label className={labelClass}>Acciones conjuntas con ITEC *</label>
            <textarea
              value={form.actions_description}
              onChange={(e) => setForm({ ...form, actions_description: e.target.value })}
              placeholder="Describa detalladamente las acciones, proyectos o programas que ITEC desarrolla junto a esta entidad..."
              rows={5}
              className={`${inputClass} resize-none`}
              required
              minLength={10}
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              {form.actions_description.length}/10 caracteres mínimo
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm text-[var(--text-secondary)] hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : partner ? (
                'Actualizar Institución'
              ) : (
                'Crear Institución'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}