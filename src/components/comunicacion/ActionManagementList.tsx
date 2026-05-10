'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Trash2, 
  Clock,
  AlertCircle,
  ExternalLink,
  Users
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { deleteActionAction } from '@/app/dashboard/acciones/actions'
import { ItecAction } from '@/types/database'

interface ActionManagementListProps {
  actions: ItecAction[]
}

export function ActionManagementList({ actions: initialActions }: ActionManagementListProps) {
  const [actions, setActions] = useState(initialActions)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta acción? (Se borrarán también las inscripciones)')) return
    
    setIsDeleting(id)
    try {
      const res = await deleteActionAction(id)
      if (res.success) {
        setActions(prev => prev.filter(a => a.id !== id))
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
            <Calendar className="text-purple-400" size={24} />
            Gestión de Acciones (Capacitaciones/Eventos)
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Administrá las actividades públicas del ITEC</p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
          {actions.length} Acciones
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/5">
              <th className="px-8 py-5">Acción</th>
              <th className="px-8 py-5">Tipo / Estado</th>
              <th className="px-8 py-5">Inicio</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {actions.map((action) => (
                <motion.tr 
                  key={action.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {action.thumbnail_url || action.media_urls?.[0] ? (
                        <img 
                          src={action.thumbnail_url || action.media_urls?.[0]} 
                          className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                          alt="" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                          <Calendar size={20} className="text-purple-400/40" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                          {action.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-medium mt-1 uppercase">
                          <Users size={10} />
                          {action.target_audience || 'Público General'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        {action.type.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        action.status === 'en_curso' ? 'bg-blue-500/10 text-blue-400' :
                        action.status === 'finalizada' ? 'bg-white/10 text-white/40' : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {action.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs text-white/60 font-medium">
                      {action.start_date ? format(new Date(action.start_date), "d MMM, HH:mm", { locale: es }) : 'Sin fecha'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a 
                        href={`/acciones/${action.id}`}
                        target="_blank"
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button 
                        onClick={() => handleDelete(action.id)}
                        disabled={isDeleting === action.id}
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all disabled:opacity-30"
                      >
                        {isDeleting === action.id ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                            <Clock size={16} />
                          </motion.div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {actions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <AlertCircle size={48} />
                    <p className="text-sm font-medium">No hay acciones para mostrar</p>
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
