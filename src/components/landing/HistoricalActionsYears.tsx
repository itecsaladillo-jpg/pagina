'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Calendar, Sparkles, X, ChevronDown, History, Layers, ExternalLink } from 'lucide-react'
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

// Resumen conceptual de cada período para enriquecer el timeline
const YEAR_THEMES: Record<number, { subtitle: string; tag: string }> = {
  2022: { subtitle: 'Fundación & Legado Cicaré', tag: 'Génesis' },
  2023: { subtitle: 'Consolidación & Talleres', tag: 'Comunidad' },
  2024: { subtitle: 'Sinergias & Vinculación', tag: 'Alianzas' },
  2025: { subtitle: 'Vanguardia, IA & Agro', tag: 'Innovación' },
}

interface HistoricalActionsYearsProps {
  historicalActions?: Record<number, HistoricalAction[]>
}

export function HistoricalActionsYears({ historicalActions }: HistoricalActionsYearsProps = {}) {
  const { dict } = useLanguage()
  // Inicializamos con 2025 para aprovechar el espacio desde el primer instante sin vacíos
  const [selectedYear, setSelectedYear] = useState<number | null>(2025)

  const data = historicalActions || HISTORICAL_ACTIONS_DATA

  // Sumatoria total de hitos en la memoria
  const totalAcciones = Object.values(data).reduce((acc, curr) => acc + (curr?.length || 0), 0)

  const handleYearClick = (year: number) => {
    setSelectedYear(prev => (prev === year ? null : year))
  }

  const actions: HistoricalAction[] = selectedYear ? (data[selectedYear] || []) : []

  return (
    <section className="mt-20 relative z-10 rounded-3xl p-6 sm:p-9 lg:p-12 bg-gradient-to-b from-white/[0.04] via-white/[0.015] to-transparent border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Resplandores ambientales decorativos */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* ENCABEZADO SUPERIOR: Ocupa y equilibra los espacios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-8 border-b border-white/10 relative z-10">
        {/* Columna Izquierda (7 cols): Badge, Título con animación y Descripción */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase px-3.5 py-1.5 rounded-full border border-[var(--accent-warm)]/30 bg-[var(--accent-warm)]/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] mb-3"
          >
            <Sparkles size={12} className="text-[var(--accent-warm)] animate-pulse" />
            <span>{dict.impactSection.accionesBadge || 'MEMORIA INSTITUCIONAL'}</span>
          </motion.div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-black text-white leading-tight tracking-tight mb-3">
            {dict.impactSection.accionesTitleStart || 'ACCIONES DE ITEC'}{' '}
            <span className="text-gradient block sm:inline">
              {dict.impactSection.accionesTitleEnd || 'DESDE SU NACIMIENTO'}
            </span>
          </h2>

          <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed max-w-xl">
            {dict.impactSection.accionesDesc || 'Explorá los proyectos, eventos e iniciativas que forjaron la historia de ITEC desde sus primeros pasos.'}
          </p>
        </div>

        {/* Columna Derecha (5 cols): Síntesis visual y métricas institucionales para evitar espacios vacíos */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 w-full">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/30 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Trayectoria</span>
              <History size={16} className="text-blue-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">4 Años</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">2022 — Actualidad</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm flex flex-col justify-between hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Registro</span>
              <Layers size={16} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">+{totalAcciones}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Hitos documentados</div>
            </div>
          </div>

          {/* Enlace oficial a Instagram directo en la cabecera */}
          <a
            href="https://www.instagram.com/itec_saladillo/"
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 group/ig flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-all text-xs font-semibold text-pink-200 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover/ig:scale-110 transition-transform">
                <InstagramIcon className="w-4 h-4" />
              </div>
              <span>Archivo fotográfico oficial en @itec_saladillo</span>
            </div>
            <ArrowUpRight size={15} className="text-pink-400 group-hover/ig:translate-x-0.5 group-hover/ig:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* SELECTOR DE AÑOS / LÍNEA DE TIEMPO INTERACTIVA */}
      <div className="my-8 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Línea de tiempo institucional
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
              Seleccioná un año
            </span>
          </div>

          {selectedYear && (
            <button
              type="button"
              onClick={() => setSelectedYear(null)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              <X size={13} />
              <span>Colapsar vista</span>
            </button>
          )}
        </div>

        {/* Grid de Cápsulas de Años (4 columnas) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {HISTORICAL_YEARS.map((year) => {
            const isSelected = selectedYear === year
            const yearActionsCount = (data[year] || []).length
            const meta = YEAR_THEMES[year] || { subtitle: 'Acciones del año', tag: 'Memoria' }

            return (
              <button
                key={year}
                type="button"
                onClick={() => handleYearClick(year)}
                aria-pressed={isSelected}
                aria-label={`Ver hitos y acciones del año ${year}`}
                className={`
                  group relative text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden border
                  ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 text-white border-cyan-300/80 shadow-[0_0_35px_rgba(6,182,212,0.35)] scale-[1.02]'
                      : 'bg-white/[0.025] hover:bg-white/[0.07] text-slate-300 hover:text-white border-white/10 hover:border-blue-400/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:scale-[1.01]'
                  }
                `}
              >
                {/* Acento superior de línea de tiempo */}
                <div 
                  className={`
                    absolute top-0 left-0 right-0 h-1 transition-all duration-300
                    ${isSelected ? 'bg-cyan-200' : 'bg-transparent group-hover:bg-blue-400/40'}
                  `} 
                />

                {/* Tag contextual y contador */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-black/20 text-cyan-100 border border-white/20' : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}>
                    {meta.tag}
                  </span>
                  
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${isSelected ? 'text-cyan-100' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-200 animate-ping' : 'bg-blue-400/60'}`} />
                    {yearActionsCount} {yearActionsCount === 1 ? 'hito' : 'hitos'}
                  </span>
                </div>

                {/* Número de año destacado */}
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-100 group-hover:text-blue-300'} transition-colors`}>
                    {year}
                  </span>
                  {isSelected && (
                    <ChevronDown size={18} className="text-white animate-bounce" />
                  )}
                </div>

                {/* Subtítulo del período */}
                <p className={`text-xs mt-1.5 line-clamp-1 font-medium ${isSelected ? 'text-blue-100' : 'text-[var(--text-muted)] group-hover:text-slate-300'} transition-colors`}>
                  {meta.subtitle}
                </p>

                {/* Glow decorativo de fondo en hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-blue-500/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENIDO DESPLEGABLE DE LAS ACCIONES DEL AÑO SELECCIONADO */}
      <AnimatePresence mode="wait">
        {selectedYear ? (
          <motion.div
            key={selectedYear}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-6 pt-6 border-t border-white/10"
          >
            {/* Barra de cabecera del año activo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/25 border border-cyan-300/30">
                  {selectedYear}
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span>{dict.impactSection.accionesDe || 'Acciones y Proyectos de'} {selectedYear}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                      {actions.length} {actions.length === 1 ? 'actividad' : 'actividades'}
                    </span>
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {YEAR_THEMES[selectedYear]?.subtitle} — Enlazadas a su difusión oficial.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <a
                  href="https://www.instagram.com/itec_saladillo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-200 hover:text-white transition-all group/ig"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-400 group-hover/ig:scale-110 transition-transform" />
                  <span>Ver en Instagram</span>
                  <ArrowUpRight size={14} className="group-hover/ig:translate-x-0.5 group-hover/ig:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Grilla de Acciones del Año */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {actions.map((action, idx) => (
                <motion.a
                  key={action.id}
                  href={action.socialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group/card relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_4px_30px_rgba(6,182,212,0.15)] hover:-translate-y-0.5 cursor-pointer"
                >
                  <div>
                    {/* Metadatos superiores: Categoría y Fecha */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {action.category}
                      </span>
                      {action.date && (
                        <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {action.date}
                        </span>
                      )}
                    </div>

                    {/* Título de la acción */}
                    <h5 className="text-sm sm:text-base font-bold text-white group-hover/card:text-cyan-300 transition-colors leading-snug">
                      {action.title}
                    </h5>

                    {/* Descripción breve */}
                    {action.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-2.5 leading-relaxed line-clamp-3">
                        {action.description}
                      </p>
                    )}
                  </div>

                  {/* Footer de la tarjeta con link a redes */}
                  <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-pink-300/80 group-hover/card:text-pink-300 font-medium">
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>{dict.impactSection.verPublicacionInstagram || 'Ver publicación oficial'}</span>
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/5 group-hover/card:bg-cyan-500/20 flex items-center justify-center text-slate-400 group-hover/card:text-cyan-300 transition-all">
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
          </motion.div>
        ) : (
          /* Estado colapsado: invitación visual que evita el vacío */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-8 rounded-2xl bg-white/[0.015] border border-white/5 text-center flex flex-col items-center justify-center gap-2"
          >
            <p className="text-sm text-slate-300 font-medium">
              Hacé click en cualquiera de los años de la línea de tiempo superior para explorar sus hitos y proyectos.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Cada actividad cuenta con su registro histórico y enlace a los canales de comunicación de ITEC Saladillo.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
