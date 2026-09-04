'use client'

import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmDialogProps) {
  const icon = variant === 'danger'
    ? <Trash2 size={20} className="text-red-400" />
    : <AlertTriangle size={20} className="text-amber-400" />

  const confirmBtn = variant === 'danger'
    ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/25 text-red-400'
    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 text-amber-400'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div
        className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-sm p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onCancel} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>

        <p className="text-sm text-[var(--text-muted)] mb-6">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors disabled:opacity-50 ${confirmBtn}`}
          >
            {isPending ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
