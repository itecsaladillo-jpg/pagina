'use client'

import { useState } from 'react'
import { deleteArticleAction } from '@/app/dashboard/comunicacion/actions'

export function EmergencyDeleteButton({ articleId }: { articleId: string }) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    if (!confirm('¿BORRAR ESTE ARTÍCULO DE FORMA PERMANENTE?')) return
    setLoading(true)
    try {
      const res = await deleteArticleAction(articleId)
      if (res.success) {
        alert('Artículo borrado con éxito. La página se recargará.')
        window.location.reload()
      } else {
        alert('Error: ' + res.error)
      }
    } catch (err) {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleAction}
      disabled={loading}
      className="px-2 py-1 bg-red-500 text-white font-black rounded hover:bg-red-600 transition-colors disabled:opacity-50"
    >
      {loading ? 'BORRANDO...' : 'BORRAR ARTÍCULO ENCONTRADO'}
    </button>
  )
}
