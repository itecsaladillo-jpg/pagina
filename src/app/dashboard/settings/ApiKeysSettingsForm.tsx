'use client'

import { useState, useEffect, useCallback } from 'react'
import { getApiKeysAction, updateApiKeyAction, type ApiKeyInfo } from './actions'
import { Key, Brain, Mail, Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export function ApiKeysSettingsForm() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    const res = await getApiKeysAction()
    if (res.success && res.keys) {
      setKeys(res.keys)
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al cargar las API keys.' })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const res = await getApiKeysAction()
      if (!cancelled) {
        if (res.success && res.keys) {
          setKeys(res.keys)
        } else {
          setMessage({ type: 'error', text: res.error || 'Error al cargar las API keys.' })
        }
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSave = async (key: string) => {
    const value = editedValues[key]
    if (value === undefined) return

    setSaving(key)
    setMessage(null)

    const res = await updateApiKeyAction(key, value)

    if (res.success) {
      setMessage({ type: 'success', text: `${key} actualizada correctamente.` })
      setEditedValues(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setVisibleKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      await fetchKeys()
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al guardar.' })
    }
    setSaving(null)
  }

  const aiKeys = keys.filter(k => k.category === 'ai')
  const emailKeys = keys.filter(k => k.category === 'email')

  const renderKeyRow = (keyInfo: ApiKeyInfo) => {
    const isVisible = visibleKeys.has(keyInfo.key)
    const isEditing = keyInfo.key in editedValues
    const isSaving = saving === keyInfo.key

    return (
      <div key={keyInfo.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-widest ml-1">
            {keyInfo.label}
          </label>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
            keyInfo.source === 'database'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            {keyInfo.source === 'database' ? 'BD' : '.env'}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
            <input
              type={isVisible ? 'text' : 'password'}
              placeholder={keyInfo.hasValue ? keyInfo.maskedValue : 'No configurado'}
              value={editedValues[keyInfo.key] ?? ''}
              onChange={(e) => setEditedValues(prev => ({ ...prev, [keyInfo.key]: e.target.value }))}
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-10 pr-12 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => toggleVisibility(keyInfo.key)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => handleSave(keyInfo.key)}
              disabled={isSaving}
              className="btn-primary px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium disabled:opacity-50 whitespace-nowrap"
            >
              {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Guardar
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[var(--accent-primary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
          message.type === 'success'
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
        <Brain size={18} className="text-[var(--accent-primary-2)]" />
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Inteligencia Artificial</h3>
        <button
          type="button"
          onClick={fetchKeys}
          className="ml-auto text-[var(--text-muted)] hover:text-white transition-colors"
          title="Recargar"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiKeys.map(renderKeyRow)}
      </div>

      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2 mt-8">
        <Mail size={18} className="text-purple-400" />
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Comunicaciones & Email</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {emailKeys.map(renderKeyRow)}
      </div>
    </div>
  )
}
