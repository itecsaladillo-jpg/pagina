'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Calendar, Sparkles, X, ChevronDown } from 'lucide-react'
import { HISTORICAL_ACTIONS_DATA, HISTORICAL_YEARS, type HistoricalAction } from '@/data/historicalActions'
import { useLanguage } from '@/contexts/LanguageContext'

// Ícono SVG fiel y estilizado de Instagram
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

export function HistoricalActionsYears() {
  const { dict } = useLanguage()
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const handleYearClick = (year: number) => {
    setSelectedYear(prev => (prev === year ? null : year))
  }

  const actions: HistoricalAction[] = selectedYear ? (HISTORICAL_ACTIONS_DATA[selectedYear] || []) : []

  return (
    <div className="mt-14 relative z-10">
      {/* Título interactivo solicitado: AÑOS ANTERIORES: 2022, 2023, 2024, 2025 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <span className="text-[var(--text-secondary)]">
              {dict.impactSection.aniosAnteriores || 'AÑOS ANTERIORES:'}
            </span>
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {HISTORICAL_YEARS.map((year, idx) => {
              const isSelected = selectedYear === year
              const isLast = idx === HISTORICAL_YEARS.length - 1

              return (
                <div key={year} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => handleYearClick(year)}
                    aria-label={`Ver acciones del año ${year}`}
                    aria-expanded={isSelected}
                    className={`
                      cursor-pointer px-3.5 py-1.5 rounded-xl font-black text-base sm:text-lg md:text-xl transition-all duration-300
                      flex items-center gap-1.5 relative select-none
                      ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105 border border-cyan-300/40'
                          : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.1] border border-white/10 hover:border-blue-400/40 hover:scale-105'
                      }
                    `}
                  >
                    <span>{year}</span>
                    {isSelected ? (
                      <ChevronDown size={16} className="text-white animate-bounce" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 group-hover:bg-blue-400" />
                    )}
                  </button>
                  {!isLast && (
                    <span className="text-slate-500 font-bold text-base sm:text-lg md:text-xl ml-1 mr-0.5 select-none">
                      ,
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {selectedYear && (
          <button
            type="button"
            onClick={() => setSelectedYear(null)}
            className="self-start md:self-center inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            <X size={14} />
            <span>Cerrar listado</span>
          </button>
        )}
      </div>

      <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2">
        Hacé click en cada año para explorar el archivo histórico de acciones y sus publicaciones en redes sociales.
      </p>

      {/* Listado desplegable animado de acciones del año seleccionado */}
      <AnimatePresence mode="wait">
        {selectedYear && (
          <motion.div
            key={selectedYear}
            initial={{ opacity: 0, y: -15, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -15, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-8 rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white/[0.04] to-black/60 border border-white/10 backdrop-blur-xl shadow-2xl relative">
              {/* Encabezado del contenedor */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/20">
                    {selectedYear}
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      {dict.impactSection.accionesDe || 'Acciones de'} {selectedYear}
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                        {actions.length} {actions.length === 1 ? 'actividad' : 'actividades'}
                      </span>
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Cada título enlaza a la difusión oficial en redes sociales de ITEC Saladillo.
                    </p>
                  </div>
                </div>

                <a
                  href="https://www.instagram.com/itec_saladillo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-pink-500/30 text-pink-200 hover:text-white hover:border-pink-400 transition-all group/ig"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-400 group-hover/ig:scale-110 transition-transform" />
                  <span>@itec_saladillo en Instagram</span>
                  <ArrowUpRight size={14} className="group-hover/ig:translate-x-0.5 group-hover/ig:-translate-y-0.5 transition-transform" />
                </a>
              </div>

              {/* Lista de acciones */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {actions.map((action, idx) => (
                  <motion.a
                    key={action.id}
                    href={action.socialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group/card relative flex flex-col justify-between p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(59,130,246,0.15)] hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div>
                      {/* Metadatos superiores: Categoría y Fecha */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                          {action.category}
                        </span>
                        {action.date && (
                          <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {action.date}
                          </span>
                        )}
                      </div>

                      {/* Título de la acción (Link directo) */}
                      <h5 className="text-sm sm:text-base font-bold text-white group-hover/card:text-blue-300 transition-colors leading-snug">
                        {action.title}
                      </h5>

                      {/* Descripción breve si existe */}
                      {action.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed line-clamp-2">
                          {action.description}
                        </p>
                      )}
                    </div>

                    {/* Footer de la tarjeta con link a redes */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-pink-300/80 group-hover/card:text-pink-300 font-medium">
                        <InstagramIcon className="w-3.5 h-3.5" />
                        <span>{dict.impactSection.verPublicacionInstagram || 'Ver en Instagram'}</span>
                      </span>
                      <div className="w-7 h-7 rounded-full bg-white/5 group-hover/card:bg-blue-500/20 flex items-center justify-center text-slate-400 group-hover/card:text-blue-300 transition-all">
                        <ArrowUpRight size={14} className="group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>

              {actions.length === 0 && (
                <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                  {dict.impactSection.sinAcciones || 'No hay acciones registradas para este año.'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
