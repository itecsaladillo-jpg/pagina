'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ITEC Global Error]:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-400">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2 text-zinc-100">
        Algo no salió como esperábamos
      </h1>
      <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
        Ocurrió un error inesperado al cargar la página. Nuestro equipo técnico fue notificado del inconveniente.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition border border-zinc-700/50"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
