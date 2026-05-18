'use client'

import { useState } from 'react'
import { updateSiteSettingsAction } from './actions'
import { Save, Loader2, CheckCircle2, AlertCircle, Mail, Lock, Layout, Cloud, Eye, EyeOff, Folder, FileCode } from 'lucide-react'

interface Props {
  settings: any
}

export function SettingsForm({ settings }: Props) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    hero_title: settings.hero_title || '',
    hero_subtitle: settings.hero_subtitle || '',
    contact_email: settings.contact_email || '',
    google_drive_email: settings.google_drive_email || '',
    google_drive_password: settings.google_drive_password || '',
    google_drive_root_id: settings.google_drive_root_id || '',
    google_service_account_json: settings.google_service_account_json || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await updateSiteSettingsAction(formData)

    if (res.success) {
      setMessage({ type: 'success', text: 'Configuración actualizada con éxito.' })
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al actualizar.' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Sección Landing Page */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
          <Layout size={18} className="text-[var(--accent-primary-2)]" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Apariencia Landing Page</h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">Título Principal (Hero)</label>
            <input
              type="text"
              value={formData.hero_title}
              onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">Subtítulo (Hero)</label>
            <textarea
              rows={3}
              value={formData.hero_subtitle}
              onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Sección Google Drive */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
          <Cloud size={18} className="text-blue-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Integración Google Drive</h3>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 mb-6">
          <p className="text-[var(--text-muted)] text-xs leading-relaxed italic">
            * Nota: Estos datos se utilizan para la gestión automatizada de archivos. Se recomienda usar una <strong>Contraseña de Aplicación</strong> si la cuenta tiene 2FA activado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">Cuenta Gmail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type="email"
                placeholder="institucional@gmail.com"
                value={formData.google_drive_email}
                onChange={(e) => setFormData({ ...formData, google_drive_email: e.target.value })}
                className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:border-blue-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={formData.google_drive_password}
                onChange={(e) => setFormData({ ...formData, google_drive_password: e.target.value })}
                className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-12 pr-12 py-3 text-white text-sm focus:border-blue-500/50 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">ID de Carpeta Raíz (Google Drive)</label>
          <div className="relative">
            <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="text"
              placeholder="Ej: 1B2C3D4E5F6G7H8I9J0K..."
              value={formData.google_drive_root_id}
              onChange={(e) => setFormData({ ...formData, google_drive_root_id: e.target.value })}
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:border-blue-500/50 outline-none transition-all"
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] ml-1">
            * El ID es el código que aparece al final de la URL cuando abrís la carpeta en Drive.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1 flex items-center gap-2">
            <FileCode size={14} />
            Google Service Account (JSON)
          </label>
          <textarea
            rows={4}
            placeholder='{ "type": "service_account", ... }'
            value={formData.google_service_account_json}
            onChange={(e) => setFormData({ ...formData, google_service_account_json: e.target.value })}
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-[10px] font-mono focus:border-blue-500/50 outline-none transition-all resize-none"
          />
          <p className="text-[10px] text-[var(--text-muted)] ml-1 leading-relaxed">
            * <strong>Requerido para listar archivos en tiempo real.</strong> Crea una cuenta de servicio en Google Cloud, descarga el JSON y pegalo aquí.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-4 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Save size={20} />
        )}
        {loading ? 'Guardando Cambios...' : 'Guardar Configuración Global'}
      </button>
    </form>
  )
}
