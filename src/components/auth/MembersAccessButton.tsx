'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MembersAccessButtonProps {
  className?: string
  children: React.ReactNode
}

/**
 * Botón de Acceso Miembros que dispara directamente el OAuth de Google
 * sin pasar por la página /login, evitando la doble pantalla.
 */
export function MembersAccessButton({ className, children }: MembersAccessButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleAccess = async () => {
    if (loading) return
    setLoading(true)

    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
    // El browser navega a Google — no se ejecuta más código
  }

  return (
    <button
      onClick={handleAccess}
      disabled={loading}
      className={className}
      aria-label="Acceso Miembros"
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Cargando...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
