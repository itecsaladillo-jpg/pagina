'use client'

import { Calendar, MapPin, Sparkles, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ProximaActividad } from '@/types/database'

interface Props {
  actividades: ProximaActividad[]
}

export function PizarraProximasActividades({ actividades }: Props) {
  // Ordenar cronológicamente las actividades
  const sorted = [...actividades].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  const formatFecha = (fechaStr: string) => {
    try {
      const d = new Date(fechaStr)
      if (isNaN(d.getTime())) return fechaStr
      return format(d, "EEEE d 'de' MMMM · HH:mm 'hs'", { locale: es })
    } catch {
      return fechaStr
    }
  }

  const formatBadgeDia = (fechaStr: string) => {
    try {
      const d = new Date(fechaStr)
      if (isNaN(d.getTime())) return { dia: '--', mes: '---' }
      const dia = format(d, 'dd')
      const mes = format(d, 'MMM', { locale: es }).toUpperCase().replace('.', '')
      return { dia, mes }
    } catch {
      return { dia: '--', mes: '---' }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-b from-[#0e1628]/90 via-[#0a0f1d]/80 to-black/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)] flex flex-col h-full min-h-[360px] overflow-hidden"
    >
      {/* Luz ambiental decorativa */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 blur-[90px] rounded-full pointer-events-none -ml-16 -mb-16" />

      {/* Encabezado de la Pizarra */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1px] shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-black/60 rounded-[15px] flex items-center justify-center backdrop-blur-sm">
              <Calendar size={20} className="text-amber-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Pizarra de Próximas Actividades
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Agenda de encuentros, talleres y eventos de Saladillo
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Agenda Abierta</span>
        </div>
      </div>

      {/* Contenido / Listado sin imágenes */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        {sorted.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-zinc-500">
              <Calendar size={24} />
            </div>
            <p className="text-zinc-300 font-semibold text-base">
              No hay actividades programadas por el momento
            </p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Estamos preparando los próximos encuentros, conferencias y talleres. Muy pronto publicaremos las fechas aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {sorted.map((actividad, index) => {
              const { dia, mes } = formatBadgeDia(actividad.fecha)
              const fechaTexto = formatFecha(actividad.fecha)

              return (
                <motion.div
                  key={actividad.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-amber-400/30 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex items-center gap-4 sm:gap-5"
                >
                  {/* Badge de Fecha Calendario */}
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex flex-col items-center justify-center text-center group-hover:border-amber-400/40 transition-colors shadow-inner">
                    <span suppressHydrationWarning className="text-[10px] sm:text-xs font-black tracking-wider text-amber-400 leading-tight">
                      {mes}
                    </span>
                    <span suppressHydrationWarning className="text-lg sm:text-xl font-black text-white leading-none mt-0.5">
                      {dia}
                    </span>
                  </div>

                  {/* Datos del Evento: Título, Fecha y Lugar */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                      {actividad.titulo}
                    </h4>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-zinc-400 font-medium capitalize">
                        <Calendar size={13} className="text-amber-400/80 flex-shrink-0" />
                        <span suppressHydrationWarning>{fechaTexto}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-zinc-300 font-medium">
                        <MapPin size={13} className="text-indigo-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-[280px]">
                          {actividad.lugar}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-amber-400 flex-shrink-0">
                    <ChevronRight size={18} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
