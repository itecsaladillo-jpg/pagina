'use client'

import { useState } from 'react'
import { updateMeetLinkAction } from './actions'

interface Props {
  commissionId: string
  commissionName: string
  currentLink: string | null
}

export function MeetLinkEditor({ commissionId, commissionName, currentLink }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [link, setLink] = useState(currentLink || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateMeetLinkAction(commissionId, link)
      setIsEditing(false)
    } catch {
      alert('Error al guardar el link')
    }
    setSaving(false)
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          Link de Meet
        </span>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[9px] uppercase tracking-widest text-[var(--accent-primary)] hover:text-white transition-colors"
          >
            Cambiar
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://meet.google.com/xxx-yyy-zzz"
            className="flex-1 bg-white/5 border border-[var(--accent-primary)]/40 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--accent-primary)]"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[var(--accent-primary)] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? '...' : 'Guardar'}
          </button>
          <button
            onClick={() => { setIsEditing(false); setLink(currentLink || '') }}
            className="px-3 py-2 border border-white/10 rounded-lg text-xs text-[var(--text-muted)] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 truncate transition-colors"
            >
              {link}
            </a>
          ) : (
            <span className="text-xs text-[var(--text-muted)] italic">Sin link configurado</span>
          )}
        </div>
      )}
    </div>
  )
}
