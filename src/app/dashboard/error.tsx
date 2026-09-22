'use client'

import React, { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ITEC Dashboard Error]:', error)
  }, [error])

  return (
    <div className="p-8 max-w-2xl mx-auto my-12 text-center">
      <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-zinc-100 mb-2">
          Error al cargar esta sección del panel
        </h2>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          {error?.message || 'No se pudieron recuperar los datos actualizados. Podés intentar recargar la vista.'}
        </p>

        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20"
        >
          Reintentar acción
        </button>
      </div>
    </div>
  )
}
