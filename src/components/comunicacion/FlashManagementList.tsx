'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Trash2, 
  Clock,
  AlertCircle,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { deleteNewsFlashAction } from '@/app/dashboard/muro/actions'
import { NewsFlash } from '@/services/news'

interface FlashManagementListProps {
  flashes: NewsFlash[]
}

export function FlashManagementList({ flashes: initialFlashes }: FlashManagementListProps) {
  const [flashes, setFlashes] = useState(initialFlashes)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta novedad?')) return
    
    setIsDeleting(id)
    try {
      const res = await deleteNewsFlashAction(id)
      if (res.success) {
        setFlashes(prev => prev.filter(f => f.id !== id))
      } else {
        alert('Error: ' + res.error)
      }
    } catch (err) {
      alert('Error al eliminar')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="glass border border-white/5 rounded-3xl overflow-hidden mt-8">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Zap className="text-amber-400" size={24} />
            Gestión de Flashes (Novedades IA)
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Administrá las novedades cortas generadas desde el Procesador IA</p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
          {flashes.length} Flashes
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/5">
              <th className="px-8 py-5">Contenido</th>
              <th className="px-8 py-5">Fuente</th>
              <th className="px-8 py-5">Fecha</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {flashes.map((flash) => (
                <motion.tr 
                  key={flash.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-8 py-6 max-w-md">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={18} className="text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {flash.title}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                          {flash.flash_text}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      {flash.source_type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs text-white/60 font-medium">
                      {format(new Date(flash.created_at), "d MMM, yyyy", { locale: es })}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDelete(flash.id)}
                      disabled={isDeleting === flash.id}
                      className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all disabled:opacity-30"
                    >
                      {isDeleting === flash.id ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                          <Clock size={16} />
                        </motion.div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {flashes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <AlertCircle size={48} />
                    <p className="text-sm font-medium">No hay flashes para mostrar</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
