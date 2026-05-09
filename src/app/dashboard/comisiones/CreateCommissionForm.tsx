'use client'

import { useState } from 'react'
import { createCommissionAction } from './actions'

export function CreateCommissionForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await createCommissionAction(formData)
    setLoading(false)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary text-sm px-4 py-2"
      >
        + Nueva Comisión
      </button>
    )
  }

  return (
    <div className="glass border border-[var(--border-subtle)] rounded-xl p-6 mb-8 animate-fade-in">
      <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Crear Nueva Comisión</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[var(--text-muted)] text-xs mb-1">Nombre</label>
          <input 
            name="name" 
            required 
            placeholder="Ej: Tecnología e Innovación"
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
        <div>
          <label className="block text-[var(--text-muted)] text-xs mb-1">Slug (URL)</label>
          <input 
            name="slug" 
            required 
            placeholder="ej: tecnologia-innovacion"
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[var(--text-muted)] text-xs mb-1">Descripción</label>
          <textarea 
            name="description" 
            rows={2}
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent-primary)] resize-none"
          />
        </div>
        <div>
          <label className="block text-[var(--text-muted)] text-xs mb-1">Emoji / Icono</label>
          <input 
            name="icon" 
            placeholder="Ej: 🚀"
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
        <div>
          <label className="block text-[var(--text-muted)] text-xs mb-1">Color (Hex)</label>
          <input 
            name="color" 
            type="color"
            defaultValue="#3b82f6"
            className="w-full bg-white/5 border border-[var(--border-subtle)] h-10 rounded-lg px-1 py-1 cursor-pointer"
          />
        </div>
        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[var(--text-muted)] hover:text-white text-sm"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="btn-primary text-sm px-6 py-2"
          >
            {loading ? 'Creando...' : 'Crear Comisión'}
          </button>
        </div>
      </form>
    </div>
  )
}
