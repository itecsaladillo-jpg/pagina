'use client'

import { useState, useEffect } from 'react'
import {
  getPromptAction,
  savePromptAction,
  listDocsAction,
  uploadDocAction,
  deleteDocAction,
  syncDocsAction,
} from './actions'
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  FileDown,
  Brain,
  BookOpen,
} from 'lucide-react'

interface AIPromptSettings {
  id?: string
  clave_prompt?: string
  system_prompt: string
  temperature: number
  max_tokens: number
  descripcion?: string | null
  updated_at?: string
}

interface DocFile {
  name: string
  size: number
  modifiedAt: string
}

export function EntrenamientoForm() {
  const [prompt, setPrompt] = useState<AIPromptSettings | null>(null)
  const [promptLoading, setPromptLoading] = useState(true)

  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.75)
  const [maxTokens, setMaxTokens] = useState(2048)

  const [docs, setDocs] = useState<DocFile[]>([])
  const [docsLoading, setDocsLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadPrompt()
    loadDocs()
  }, [])

  async function loadPrompt() {
    setPromptLoading(true)
    const res = await getPromptAction()
    if (res.success && res.data) {
      setPrompt(res.data)
      setSystemPrompt(res.data.system_prompt)
      setTemperature(res.data.temperature ?? 0.75)
      setMaxTokens(res.data.max_tokens ?? 2048)
    }
    setPromptLoading(false)
  }

  async function loadDocs() {
    setDocsLoading(true)
    const res = await listDocsAction()
    if (res.success) setDocs(res.files ?? [])
    setDocsLoading(false)
  }

  async function handleSavePrompt(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const res = await savePromptAction({ system_prompt: systemPrompt, temperature, max_tokens: maxTokens })
    setMessage(
      res.success
        ? { type: 'success', text: 'Prompt maestro actualizado con éxito.' }
        : { type: 'error', text: res.error || 'Error al guardar.' },
    )
    setSaving(false)
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    if (!fileInput?.files?.[0]) return

    setUploading(true)
    setMessage(null)
    const fd = new FormData(form)
    const res = await uploadDocAction(fd)
    if (res.success) {
      setMessage({ type: 'success', text: `"${res.fileName}" subido correctamente.` })
      showToast('success', `"${res.fileName}" subido correctamente`)
      form.reset()
      await loadDocs()
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al subir.' })
    }
    setUploading(false)
  }

  async function handleDelete(fileName: string) {
    if (!confirm(`¿Eliminar "${fileName}"?`)) return
    setDeleting(fileName)
    setMessage(null)
    const res = await deleteDocAction(fileName)
    if (res.success) {
      setMessage({ type: 'success', text: `"${fileName}" eliminado.` })
      await loadDocs()
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al eliminar.' })
    }
    setDeleting(null)
  }

  async function handleSync() {
    setSyncing(true)
    setMessage(null)
    const res = await syncDocsAction()
    if (res.success) {
      setMessage({ type: 'success', text: 'Documentos sincronizados correctamente. El asistente usará el nuevo contexto en su próxima consulta.' })
      showToast('success', 'Entrenamiento completado. El asistente actualizará su conocimiento.')
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al sincronizar.' })
      showToast('error', res.error || 'Error al sincronizar.')
    }
    setSyncing(false)
  }

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Sección 1: Prompt Maestro */}
      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4 mb-6">
          <Brain size={22} className="text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Prompt Maestro</h2>
            <p className="text-[var(--text-secondary)] text-xs">
              Instrucción de sistema que define la personalidad y el conocimiento base del Asistente ITEC.
            </p>
          </div>
        </div>

        {promptLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-purple-400" size={28} />
          </div>
        ) : (
          <form onSubmit={handleSavePrompt} className="space-y-6">
            {prompt?.updated_at && (
              <p className="text-[10px] text-[var(--text-muted)]">
                Última modificación: {new Date(prompt.updated_at).toLocaleString('es-AR')}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">
                System Prompt
              </label>
              <textarea
                rows={24}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-xs font-mono leading-relaxed focus:border-purple-500/50 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">
                  Temperature ({temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min={256}
                  max={8192}
                  step={256}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                  className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-4 rounded-xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? 'Guardando Prompt...' : 'Guardar Prompt Maestro'}
            </button>
          </form>
        )}
      </div>

      {/* Sección 2: Documentos de Entrenamiento */}
      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4 mb-6">
          <BookOpen size={22} className="text-emerald-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Documentos de Entrenamiento</h2>
            <p className="text-[var(--text-secondary)] text-xs">
              Los archivos de esta carpeta se inyectan en el contexto del asistente. Subí PDFs, TXT o MD con
              información institucional.
            </p>
          </div>
        </div>

        {/* Upload */}
        <form onSubmit={handleUpload} className="flex items-end gap-4 mb-8">
          <div className="flex-1 space-y-2">
            <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">
              Subir nuevo documento
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf,.txt,.md"
              className="w-full text-white text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 file:cursor-pointer cursor-pointer file:transition-all bg-white/5 border border-[var(--border-subtle)] rounded-xl py-2 px-4"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {uploading ? 'Subiendo...' : 'Subir'}
          </button>
        </form>

        {/* Lista de documentos */}
        {docsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-emerald-400" size={24} />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-[var(--text-secondary)] text-sm">
              No hay documentos de entrenamiento. Subí archivos PDF, TXT o MD.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between gap-4 bg-white/5 border border-[var(--border-subtle)] rounded-xl px-5 py-3 group hover:border-emerald-500/20 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText size={18} className="text-emerald-400/70 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-[var(--text-muted)] text-[10px]">
                      {formatSize(doc.size)} &middot; {new Date(doc.modifiedAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.name)}
                  disabled={deleting === doc.name}
                  className="p-2 rounded-lg text-red-400/50 hover:text-red-300 hover:bg-red-500/10 transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {deleting === doc.name ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Sync button */}
        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 mb-4">
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              Después de subir o eliminar documentos, ejecutá <strong>Actualizar Contexto</strong> para extraer el texto
              de los archivos y actualizar el contexto del asistente. Este proceso regenera el archivo{' '}
              <code className="text-emerald-400">docsContext.ts</code> que se inyecta en el prompt del asistente.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
          >
            {syncing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <RefreshCw size={20} />
            )}
            {syncing ? 'Actualizando contexto...' : 'Actualizar Contexto'}
          </button>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-900/90 border-red-500/40 text-red-200'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-6 h-6 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <AlertCircle size={24} className="text-red-400 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold">{toast.type === 'success' ? 'Operación exitosa' : 'Error'}</p>
              <p className="text-xs opacity-80">{toast.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
