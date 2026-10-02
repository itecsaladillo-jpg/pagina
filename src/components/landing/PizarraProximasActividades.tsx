'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ProximaActividad } from '@/types/database'

const CUATRO_HORAS_MS = 4 * 60 * 60 * 1000

interface Props {
  actividades: ProximaActividad[]
}

export function PizarraProximasActividades({ actividades }: Props) {
  // Estado para el tiempo actual, inicializado de forma segura y actualizado en tiempo real
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 30000) // Reevaluar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  // 1. Filtrar eventos pasados: se eliminan automáticamente si pasaron más de 4 horas desde su inicio
  // 2. Ordenar cronológicamente
  const actividadesVigentes = actividades
    .filter((act) => {
      const fechaMs = new Date(act.fecha).getTime()
      if (isNaN(fechaMs)) return false
      return now <= fechaMs + CUATRO_HORAS_MS
    })
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  // Mostrar SIEMPRE las 3 actividades más próximas a la fecha actual
  const proximasTres = actividadesVigentes.slice(0, 3)

  // Comprobar si al menos una actividad vigente ya llegó a su fecha y hora y aún no pasaron 4 horas
  const hayEventoEnCurso = proximasTres.some((act) => {
    const fechaMs = new Date(act.fecha).getTime()
    return !isNaN(fechaMs) && now >= fechaMs && now <= fechaMs + CUATRO_HORAS_MS
  })

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
      className="relative bg-gradient-to-b from-[#0e1628]/90 via-[#0a0f1d]/80 to-black/90 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)] flex flex-col h-full min-h-[270px] overflow-hidden"
    >
      {/* Luz ambiental decorativa */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20 transition-colors duration-700 ${
          hayEventoEnCurso ? 'bg-emerald-500/15' : 'bg-amber-500/10'
        }`}
      />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 blur-[90px] rounded-full pointer-events-none -ml-16 -mb-16" />

      {/* Encabezado de la Pizarra */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl p-[1px] shadow-md transition-all duration-500 ${
              hayEventoEnCurso
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20'
            }`}
          >
            <div className="w-full h-full bg-black/60 rounded-[11px] flex items-center justify-center backdrop-blur-sm">
              <Calendar
                size={17}
                className={hayEventoEnCurso ? 'text-emerald-400' : 'text-amber-400'}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              Pizarra de Próximas Actividades
            </h3>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium">
              Agenda de encuentros, talleres y eventos de ITEC Saladillo
            </p>
          </div>
        </div>

        {/* Badge de estado: 'Evento en Curso' (verde) o 'Agenda Abierta' (amarillo) */}
        {hayEventoEnCurso ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider shadow-sm shadow-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Evento en Curso</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Agenda Abierta</span>
          </div>
        )}
      </div>

      {/* Contenido / Listado: exactamente las 3 más próximas */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        {proximasTres.length === 0 ? (
          <div className="py-7 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-zinc-500">
              <Calendar size={20} />
            </div>
            <p className="text-zinc-300 font-semibold text-sm">
              No hay actividades programadas por el momento
            </p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Estamos preparando los próximos encuentros, conferencias y talleres. Muy pronto publicaremos las fechas aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[315px] overflow-y-auto pr-1 custom-scrollbar">
            {proximasTres.map((actividad, index) => {
              const { dia, mes } = formatBadgeDia(actividad.fecha)
              const fechaTexto = formatFecha(actividad.fecha)
              const fechaMs = new Date(actividad.fecha).getTime()
              const estaEnCurso = !isNaN(fechaMs) && now >= fechaMs && now <= fechaMs + CUATRO_HORAS_MS

              return (
                <motion.div
                  key={actividad.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className={`group relative rounded-xl p-3 sm:p-3.5 transition-all duration-300 flex items-center gap-3.5 sm:gap-4 ${
                    estaEnCurso
                      ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] border border-emerald-500/40 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-amber-400/30'
                  }`}
                >
                  {/* Badge de Fecha Calendario */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 sm:w-13 sm:h-13 rounded-xl border flex flex-col items-center justify-center text-center transition-colors shadow-inner ${
                      estaEnCurso
                        ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-500/10 border-emerald-500/40'
                        : 'bg-gradient-to-b from-white/10 to-white/5 border-white/10 group-hover:border-amber-400/40'
                    }`}
                  >
                    <span
                      suppressHydrationWarning
                      className={`text-[9px] sm:text-[10px] font-black tracking-wider leading-tight ${
                        estaEnCurso ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {mes}
                    </span>
                    <span
                      suppressHydrationWarning
                      className="text-base sm:text-lg font-black text-white leading-none mt-0.5"
                    >
                      {dia}
                    </span>
                  </div>

                  {/* Datos del Evento: Título, Fecha y Lugar */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm sm:text-base font-bold transition-colors leading-snug line-clamp-1 sm:line-clamp-2 ${
                          estaEnCurso
                            ? 'text-white group-hover:text-emerald-300'
                            : 'text-white group-hover:text-amber-300'
                        }`}
                      >
                        {actividad.titulo}
                      </h4>
                      {estaEnCurso && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-extrabold uppercase tracking-wider animate-pulse">
                          En Curso
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-0.5 gap-x-3 text-[11px] sm:text-xs">
                      <span
                        className={`inline-flex items-center gap-1 font-medium capitalize ${
                          estaEnCurso ? 'text-emerald-300/90' : 'text-zinc-400'
                        }`}
                      >
                        <Calendar
                          size={12}
                          className={estaEnCurso ? 'text-emerald-400 flex-shrink-0' : 'text-amber-400/80 flex-shrink-0'}
                        />
                        <span suppressHydrationWarning>{fechaTexto}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                        <MapPin size={12} className="text-indigo-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-[260px]">
                          {actividad.lugar}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div
                    className={`hidden sm:flex opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ${
                      estaEnCurso ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    <ChevronRight size={16} />
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
