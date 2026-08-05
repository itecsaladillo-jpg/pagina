'use client'

import { useState, useEffect } from 'react'
import {
  getApiKeysAction,
  updateApiKeyAction,
  type ApiKeyStatus,
  type ApiKeyCategory,
} from './actions'
import {
  Key,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Mail,
  Database,
  FileCode,
  RefreshCw,
} from 'lucide-react'

const CATEGORY_CONFIG: Record<
  ApiKeyCategory,
  { label: string; icon: typeof Brain; color: string; borderColor: string }
> = {
  ai: {
    label: 'Inteligencia Artificial & LLMs',
    icon: Brain,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/20',
  },
  comms: {
    label: 'Comunicaciones & Email',
    icon: Mail,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
  },
}

export function ApiKeysSettingsForm() {
  const [keys, setKeys] = useState<ApiKeyStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
    key?: string
  } | null>(null)

  const loadKeys = async () => {
    setLoading(true)
    const result = await getApiKeysAction()
    if (result.success && result.keys) {
      setKeys(result.keys)
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    const fetchKeys = async () => {
      const result = await getApiKeysAction()
      if (!cancelled && result.success && result.keys) {
        setKeys(result.keys)
        setLoading(false)
      }
    }
    fetchKeys()
    return () => { cancelled = true }
  }, [])

  const toggleVisibility = (keyName: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(keyName)) {
        next.delete(keyName)
      } else {
        next.add(keyName)
      }
      return next
    })
  }

  const handleSave = async (keyName: string) => {
    const value = editedValues[keyName]
    if (value === undefined) return

    setSavingKey(keyName)
    setMessage(null)

    const result = await updateApiKeyAction(keyName, value)

    if (result.success) {
      setMessage({
        type: 'success',
        text: `Clave "${keyName}" guardada correctamente.`,
        key: keyName,
      })
      // Limpiar el valor editado y recargar
      setEditedValues((prev) => {
        const next = { ...prev }
        delete next[keyName]
        return next
      })
      // Ocultar el valor después de guardarlo
      setVisibleKeys((prev) => {
        const next = new Set(prev)
        next.delete(keyName)
        return next
      })
      await loadKeys()
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Error al guardar.',
        key: keyName,
      })
    }

    setSavingKey(null)
    // Limpiar mensaje después de 4 segundos
    setTimeout(() => setMessage(null), 4000)
  }

  const groupedKeys = keys.reduce(
    (acc, key) => {
      if (!acc[key.category]) acc[key.category] = []
      acc[key.category].push(key)
      return acc
    },
    {} as Record<ApiKeyCategory, ApiKeyStatus[]>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[var(--accent-primary)]" size={24} />
        <span className="ml-3 text-[var(--text-secondary)] text-sm">
          Cargando API keys...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
            <Key size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">API Keys y Proveedores</h2>
            <p className="text-[var(--text-muted)] text-xs">
              Gestioná las credenciales de servicios externos sin redeploy
            </p>
          </div>
        </div>
        <button
          onClick={loadKeys}
          className="flex items-center gap-2 px-3 py-2 text-[var(--text-secondary)] hover:text-white text-xs rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-glow)] transition-all"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
        <Database size={16} className="text-blue-400 mt-0.5 shrink-0" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-blue-400">Fallback inteligente:</strong> Si una key
          no está configurada en la Base de Datos, el sistema usa automáticamente la
          variable de entorno (.env). Los valores nunca se envían al navegador — solo se
          muestran enmascarados aquí.
        </div>
      </div>

      {/* Mensaje de feedback global */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Categorías */}
      {Object.entries(CATEGORY_CONFIG).map(([catKey, catConfig]) => {
        const catKeys = groupedKeys[catKey as ApiKeyCategory]
        if (!catKeys || catKeys.length === 0) return null

        const Icon = catConfig.icon

        return (
          <div key={catKey} className="space-y-4">
            <div
              className={`flex items-center gap-3 border-b ${catConfig.borderColor} pb-2`}
            >
              <Icon size={18} className={catConfig.color} />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                {catConfig.label}
              </h3>
              <span className="text-[10px] text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-full">
                {catKeys.filter((k) => k.configured).length}/{catKeys.length} configuradas
              </span>
            </div>

            <div className="space-y-3">
              {catKeys.map((apiKey) => {
                const isEditing = apiKey.key in editedValues
                const isVisible = visibleKeys.has(apiKey.key)
                const isSaving = savingKey === apiKey.key

                return (
                  <div
                    key={apiKey.key}
                    className={`glass rounded-xl p-4 border transition-all ${
                      isEditing
                        ? 'border-[var(--border-glow)]'
                        : 'border-[var(--border-subtle)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="text-white text-sm font-medium">
                          {apiKey.label}
                        </label>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            apiKey.source === 'database'
                              ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                              : apiKey.source === 'env'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : 'bg-white/5 text-[var(--text-muted)] border border-white/10'
                          }`}
                        >
                          {apiKey.source === 'database' && (
                            <span className="flex items-center gap-1">
                              <Database size={10} /> BD
                            </span>
                          )}
                          {apiKey.source === 'env' && (
                            <span className="flex items-center gap-1">
                              <FileCode size={10} /> .env
                            </span>
                          )}
                          {apiKey.source === 'none' && 'Sin configurar'}
                        </span>
                      </div>

                      {apiKey.configured && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {apiKey.masked}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={
                            isEditing
                              ? editedValues[apiKey.key]
                              : isVisible
                                ? ''
                                : '••••••••••••••••••••'
                          }
                          onChange={(e) =>
                            setEditedValues((prev) => ({
                              ...prev,
                              [apiKey.key]: e.target.value,
                            }))
                          }
                          onFocus={() => {
                            if (!isEditing) {
                              setEditedValues((prev) => ({
                                ...prev,
                                [apiKey.key]: '',
                              }))
                            }
                          }}
                          placeholder={
                            apiKey.configured
                              ? `Valor actual: ${apiKey.masked}`
                              : 'Ingresar valor...'
                          }
                          className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 pr-10 text-white text-sm font-mono focus:border-[var(--accent-primary)] outline-none transition-all placeholder:text-[var(--text-muted)]"
                        />
                        <button
                          type="button"
                          onClick={() => toggleVisibility(apiKey.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSave(apiKey.key)}
                        disabled={isSaving || !isEditing}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20"
                      >
                        {isSaving ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Guardar
                      </button>
                    </div>

                    {apiKey.key in editedValues && editedValues[apiKey.key] !== '' && (
                      <p className="text-[10px] text-amber-400/70 mt-2 ml-1">
                        Se guardará en la Base de Datos y sobreescribirá la variable de
                        entorno.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {keys.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Key size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No se pudieron cargar las API keys.</p>
        </div>
      )}
    </div>
  )
}
