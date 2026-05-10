'use client'

import { useState } from 'react'
import { registerToAction } from '@/services/actions'
import { Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react'

interface Props {
  actionId: string
  capacity: number | null
}

export function ActionRegistrationForm({ actionId, capacity }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      action_id: actionId,
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      notes: ''
    }

    const res = await registerToAction(payload)

    if (res.success) {
      setIsSuccess(true)
    } else {
      setError(res.error || 'Ocurrió un error al procesar tu inscripción.')
    }
    setIsSubmitting(false)
  }

  if (isSuccess) {
    return (
      <div className="p-8 text-center space-y-4 bg-green-500/10 border border-green-500/20 rounded-2xl animate-fade-in">
        <CheckCircle2 size={48} className="mx-auto text-green-400" />
        <h3 className="text-xl font-bold text-white">¡Inscripción Exitosa!</h3>
        <p className="text-[var(--text-muted)] text-sm">
          Te enviamos un correo con los detalles. ¡Nos vemos en el ITEC!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">Nombre Completo</label>
          <input 
            required
            name="full_name"
            type="text" 
            placeholder="Juan Pérez"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/40 transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">Email Institucional o Personal</label>
          <input 
            required
            name="email"
            type="email" 
            placeholder="juan@ejemplo.com"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/40 transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">Teléfono / WhatsApp</label>
          <input 
            required
            name="phone"
            type="tel" 
            placeholder="+54 2344 000000"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/40 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs animate-fade-in">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Send size={18} />
            Confirmar Inscripción
          </>
        )}
      </button>
    </form>
  )
}
