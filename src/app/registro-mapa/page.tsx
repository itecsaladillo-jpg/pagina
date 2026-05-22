'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Perfil = 'empresa' | 'alumno' | null

interface EmpresaForm {
  nombre: string
  rubro: string
  email: string
  oferta: string
  demanda: string[]
  detalles_demanda: string
  desafio_tecnologico: string
  direccion: string
}

interface AlumnoForm {
  escuela: string
  especialidad: string
  habilidades: string[]
  habilidades_input: string
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const CATEGORIAS_DEMANDA = [
  { id: 'logistica',    label: 'Logística',                 icon: '🚛' },
  { id: 'packaging',   label: 'Packaging',                  icon: '📦' },
  { id: 'electronica', label: 'Componentes Electrónicos',   icon: '⚡' },
  { id: 'software',    label: 'Desarrollo de Software',     icon: '💻' },
  { id: 'marketing',   label: 'Marketing y Diseño',         icon: '🎨' },
]

const ESCUELAS = [
  'E.E.S.T. N°1 - Saladillo',
  'E.E.S.T. N°2 - Saladillo',
  'Instituto Técnico Municipal',
  'Otra escuela técnica',
]

const ESPECIALIDADES = [
  'Electrónica',
  'Electromecánica',
  'Informática',
  'Química',
  'Construcciones',
  'Maestro Mayor de Obras',
  'Administración',
  'Otra',
]

// Coordenadas por defecto de Saladillo
const LAT_SALADILLO = -35.637
const LNG_SALADILLO = -59.778

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function RegistroMapaPage() {
  const [perfil, setPerfil] = useState<Perfil>(null)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState<Perfil>(null)
  const [error, setError] = useState<string | null>(null)

  // Estado empresa
  const [empresa, setEmpresa] = useState<EmpresaForm>({
    nombre: '',
    rubro: '',
    email: '',
    oferta: '',
    demanda: [],
    detalles_demanda: '',
    desafio_tecnologico: '',
    direccion: '',
  })

  // Estado alumno
  const [alumno, setAlumno] = useState<AlumnoForm>({
    escuela: '',
    especialidad: '',
    habilidades: [],
    habilidades_input: '',
  })

  const formRef = useRef<HTMLDivElement>(null)

  // ─── Handlers empresa ───────────────────────────────────────────────────────

  const handleEmpresaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEmpresa(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const toggleDemanda = (id: string) => {
    setEmpresa(prev => ({
      ...prev,
      demanda: prev.demanda.includes(id)
        ? prev.demanda.filter(d => d !== id)
        : [...prev.demanda, id],
    }))
  }

  const handleSubmitEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: sbError } = await supabase.from('mapa_empresas').insert({
        nombre: empresa.nombre,
        rubro: empresa.rubro,
        email: empresa.email,
        oferta: empresa.oferta,
        demanda: empresa.demanda,
        detalles_demanda: empresa.detalles_demanda,
        desafio_tecnologico: empresa.desafio_tecnologico,
        direccion: empresa.direccion,
        latitud: LAT_SALADILLO,
        longitud: LNG_SALADILLO,
      })
      if (sbError) throw sbError
      setExito('empresa')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar. Intentá nuevamente.'
      setError(msg)
    } finally {
      setEnviando(false)
    }
  }

  // ─── Handlers alumno ────────────────────────────────────────────────────────

  const handleAlumnoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setAlumno(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleHabilidadKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      agregarHabilidades(alumno.habilidades_input)
    }
  }

  const agregarHabilidades = (raw: string) => {
    const nuevas = raw
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0 && !alumno.habilidades.includes(h))
    if (nuevas.length > 0) {
      setAlumno(prev => ({
        ...prev,
        habilidades: [...prev.habilidades, ...nuevas],
        habilidades_input: '',
      }))
    }
  }

  const eliminarHabilidad = (h: string) => {
    setAlumno(prev => ({
      ...prev,
      habilidades: prev.habilidades.filter(x => x !== h),
    }))
  }

  const handleSubmitAlumno = async (e: React.FormEvent) => {
    e.preventDefault()
    // Si quedó texto sin confirmar, lo agregamos
    if (alumno.habilidades_input.trim()) {
      agregarHabilidades(alumno.habilidades_input)
    }
    setEnviando(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: sbError } = await supabase.from('alumnos_talentos').insert({
        escuela: alumno.escuela,
        especialidad: alumno.especialidad,
        habilidades: alumno.habilidades,
      })
      if (sbError) throw sbError
      setExito('alumno')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar. Intentá nuevamente.'
      setError(msg)
    } finally {
      setEnviando(false)
    }
  }

  const seleccionarPerfil = (p: Perfil) => {
    setPerfil(p)
    setError(null)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // ─── Pantalla de éxito ──────────────────────────────────────────────────────

  if (exito) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center animate-fade-up">
          <div className="text-6xl mb-6">
            {exito === 'empresa' ? '🏭' : '🎓'}
          </div>
          <h2 className="text-2xl font-bold text-gradient mb-3">
            ¡Registro exitoso!
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            {exito === 'empresa'
              ? 'Tu empresa ya forma parte del Mapa Productivo de Saladillo. Pronto estarás conectado con alumnos y proyectos de innovación.'
              : 'Tu perfil de talento técnico fue registrado de forma anónima. Los docentes y empresas podrán encontrarte para proyectos reales.'}
          </p>
          <button
            onClick={() => { setExito(null); setPerfil(null) }}
            className="btn-primary w-full justify-center"
          >
            <span>Registrar otro</span>
          </button>
        </div>
      </div>
    )
  }

  // ─── Render principal ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="pt-10 pb-6 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-300 text-sm font-medium tracking-wide">Mapa Productivo · Saladillo</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gradient mb-3">
          Registrate en el Mapa
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-xl mx-auto">
          Conectamos empresas locales con talentos técnicos. Elegí tu perfil para comenzar.
        </p>
      </header>

      <main className="px-4 pb-20 max-w-5xl mx-auto">

        {/* Selector de perfil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {/* Empresa */}
          <button
            id="btn-perfil-empresa"
            onClick={() => seleccionarPerfil('empresa')}
            className={`
              group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300
              border-2 card-hover cursor-pointer
              ${perfil === 'empresa'
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.25)]'
                : 'border-[var(--border-subtle)] glass hover:border-blue-500/40'}
            `}
          >
            {/* Fondo decorativo */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
              bg-gradient-to-br from-blue-500/5 to-cyan-500/5 pointer-events-none" />

            <div className="text-5xl mb-4">🏭</div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              Empresa / Emprendimiento
              {perfil === 'empresa' && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Seleccionado</span>
              )}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Publicá tu oferta productiva, indicá qué insumos demandás y planteá tus desafíos tecnológicos.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
              <span>Comenzar</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </button>

          {/* Alumno */}
          <button
            id="btn-perfil-alumno"
            onClick={() => seleccionarPerfil('alumno')}
            className={`
              group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300
              border-2 card-hover cursor-pointer
              ${perfil === 'alumno'
                ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.25)]'
                : 'border-[var(--border-subtle)] glass hover:border-amber-500/40'}
            `}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
              bg-gradient-to-br from-amber-500/5 to-yellow-500/5 pointer-events-none" />

            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              Alumno Técnico Avanzado
              {perfil === 'alumno' && (
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Seleccionado</span>
              )}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Mostrá tus habilidades técnicas de forma anónima y conectate con proyectos reales de empresas locales.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
              <span>Comenzar</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FORMULARIO EMPRESA
        ═══════════════════════════════════════════════════════════════════ */}
        {perfil === 'empresa' && (
          <div
            ref={formRef}
            className="animate-fade-up glass rounded-3xl border border-blue-500/20 overflow-hidden"
          >
            {/* Header del formulario */}
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/10 px-8 py-6 border-b border-blue-500/10">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <span className="text-2xl">🏭</span>
                Registro de Empresa / Emprendimiento
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Completá los datos de tu organización para aparecer en el Mapa Productivo
              </p>
            </div>

            <form onSubmit={handleSubmitEmpresa} className="p-8 space-y-8">

              {/* Datos básicos */}
              <section className="space-y-5">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Datos de la Organización
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Nombre de la empresa *">
                    <input
                      id="empresa-nombre"
                      name="nombre"
                      type="text"
                      required
                      value={empresa.nombre}
                      onChange={handleEmpresaChange}
                      placeholder="Ej: MetalúrgicaSaladillo S.A."
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Rubro *">
                    <input
                      id="empresa-rubro"
                      name="rubro"
                      type="text"
                      required
                      value={empresa.rubro}
                      onChange={handleEmpresaChange}
                      placeholder="Ej: Metalurgia, Alimentos, TIC..."
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Email de contacto *">
                    <input
                      id="empresa-email"
                      name="email"
                      type="email"
                      required
                      value={empresa.email}
                      onChange={handleEmpresaChange}
                      placeholder="contacto@empresa.com"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Dirección (en Saladillo)">
                    <input
                      id="empresa-direccion"
                      name="direccion"
                      type="text"
                      value={empresa.direccion}
                      onChange={handleEmpresaChange}
                      placeholder="Ej: Av. San Martín 450"
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </section>

              <Divider />

              {/* Oferta */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  ¿Qué ofrecés?
                </h3>
                <FormField label="Oferta productiva o de servicios *">
                  <textarea
                    id="empresa-oferta"
                    name="oferta"
                    required
                    rows={4}
                    value={empresa.oferta}
                    onChange={handleEmpresaChange}
                    placeholder="Describí qué produce o qué servicio brinda tu empresa..."
                    className={`${inputClass} resize-none`}
                  />
                </FormField>
              </section>

              <Divider />

              {/* Demanda */}
              <section className="space-y-5">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  ¿Qué necesitás?
                </h3>

                <FormField label="Categorías de demanda">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {CATEGORIAS_DEMANDA.map(cat => {
                      const checked = empresa.demanda.includes(cat.id)
                      return (
                        <label
                          key={cat.id}
                          htmlFor={`demanda-${cat.id}`}
                          className={`
                            flex items-center gap-3 rounded-xl p-4 cursor-pointer
                            border transition-all duration-200 select-none
                            ${checked
                              ? 'border-blue-500 bg-blue-500/10 text-[var(--text-primary)]'
                              : 'border-[var(--border-subtle)] bg-white/[0.02] text-[var(--text-secondary)] hover:border-blue-500/40 hover:bg-blue-500/5'}
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                            ${checked ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}
                          `}>
                            {checked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            id={`demanda-${cat.id}`}
                            className="sr-only"
                            checked={checked}
                            onChange={() => toggleDemanda(cat.id)}
                          />
                          <span className="text-xl">{cat.icon}</span>
                          <span className="text-sm font-medium">{cat.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </FormField>

                <FormField label="Detalles de insumos que demandás">
                  <textarea
                    id="empresa-detalles-demanda"
                    name="detalles_demanda"
                    rows={3}
                    value={empresa.detalles_demanda}
                    onChange={handleEmpresaChange}
                    placeholder="Especificá cantidades, calidades, condiciones, etc."
                    className={`${inputClass} resize-none`}
                  />
                </FormField>
              </section>

              <Divider />

              {/* Desafío tecnológico */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Desafío Tecnológico
                </h3>
                <FormField label="Desafío o Proyecto a Resolver">
                  <textarea
                    id="empresa-desafio"
                    name="desafio_tecnologico"
                    rows={4}
                    value={empresa.desafio_tecnologico}
                    onChange={handleEmpresaChange}
                    placeholder="Describí el problema tecnológico que querés resolver, qué proceso mejorar o qué innovación necesitás..."
                    className={`${inputClass} resize-none`}
                  />
                </FormField>

                {/* Leyenda de privacidad */}
                <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">🔒</span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    <strong className="text-slate-300">Esta información es privada;</strong>{' '}
                    solo la verán docentes y alumnos autorizados para ayudarte a resolverlo.
                  </p>
                </div>
              </section>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <span>⚠️</span>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                id="btn-submit-empresa"
                type="submit"
                disabled={enviando}
                className="btn-primary w-full justify-center text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? (
                  <>
                    <Spinner />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <span>Registrar mi empresa en el Mapa</span>
                    <span>🗺️</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            FORMULARIO ALUMNO
        ═══════════════════════════════════════════════════════════════════ */}
        {perfil === 'alumno' && (
          <div
            ref={formRef}
            className="animate-fade-up glass rounded-3xl border border-amber-500/20 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/10 px-8 py-6 border-b border-amber-500/10">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <span className="text-2xl">🎓</span>
                Registro de Alumno Técnico Avanzado
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Tu perfil será anónimo. Solo se publicarán tus habilidades técnicas.
              </p>
            </div>

            {/* Banner de privacidad */}
            <div className="mx-8 mt-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4">
              <span className="text-xl flex-shrink-0">🛡️</span>
              <div>
                <p className="text-sm font-semibold text-amber-300 mb-0.5">Perfil anónimo y seguro</p>
                <p className="text-xs text-amber-200/70 leading-relaxed">
                  Tu perfil se mantendrá anónimo y seguro para proteger tu privacidad.
                  Solo se mostrarán tus habilidades técnicas, nunca tu nombre ni datos personales.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAlumno} className="p-8 space-y-8">

              {/* Escuela y especialidad */}
              <section className="space-y-5">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Tu Institución
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Escuela Técnica *">
                    <select
                      id="alumno-escuela"
                      name="escuela"
                      required
                      value={alumno.escuela}
                      onChange={handleAlumnoChange}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Seleccioná tu escuela</option>
                      {ESCUELAS.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Especialidad *">
                    <select
                      id="alumno-especialidad"
                      name="especialidad"
                      required
                      value={alumno.especialidad}
                      onChange={handleAlumnoChange}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Seleccioná tu especialidad</option>
                      {ESPECIALIDADES.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </section>

              <Divider accent="amber" />

              {/* Habilidades */}
              <section className="space-y-5">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Tus Habilidades Técnicas
                </h3>

                <FormField
                  label="Agregá tus habilidades"
                  hint="Escribí una habilidad y presioná Enter o coma para agregarla"
                >
                  <div className={`${inputClass} !p-3 space-y-2`}>
                    {/* Tags existentes */}
                    {alumno.habilidades.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {alumno.habilidades.map(h => (
                          <span
                            key={h}
                            className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30
                              text-amber-300 text-xs font-medium rounded-lg px-2.5 py-1"
                          >
                            {h}
                            <button
                              type="button"
                              onClick={() => eliminarHabilidad(h)}
                              className="text-amber-400/60 hover:text-amber-400 transition-colors ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Input */}
                    <input
                      id="alumno-habilidades-input"
                      type="text"
                      value={alumno.habilidades_input}
                      onChange={e => setAlumno(prev => ({ ...prev, habilidades_input: e.target.value }))}
                      onKeyDown={handleHabilidadKeyDown}
                      onBlur={() => {
                        if (alumno.habilidades_input.trim()) agregarHabilidades(alumno.habilidades_input)
                      }}
                      placeholder={alumno.habilidades.length === 0 ? 'Ej: Arduino, soldadura SMD, AutoCAD...' : 'Agregar otra...'}
                      className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)]
                        text-sm outline-none border-none"
                    />
                  </div>
                </FormField>

                {/* Ejemplos de habilidades */}
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-muted)]">Sugerencias rápidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Arduino', 'Python', 'Soldadura', 'AutoCAD', 'Impresión 3D', 'Redes', 'PLC', 'Diseño Gráfico'].map(sug => (
                      !alumno.habilidades.includes(sug) && (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setAlumno(prev => ({
                            ...prev,
                            habilidades: [...prev.habilidades, sug]
                          }))}
                          className="text-xs border border-slate-700 text-slate-400 hover:border-amber-500/50
                            hover:text-amber-300 rounded-lg px-2.5 py-1 transition-all duration-150"
                        >
                          + {sug}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </section>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <span>⚠️</span>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                id="btn-submit-alumno"
                type="submit"
                disabled={enviando || alumno.habilidades.length === 0}
                className="w-full justify-center text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed
                  rounded-full font-bold flex items-center gap-2 transition-all duration-200
                  bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900
                  hover:shadow-[0_8px_30px_rgba(245,158,11,0.4)] hover:scale-[1.02]"
              >
                {enviando ? (
                  <>
                    <Spinner color="dark" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <span>Publicar mi perfil técnico</span>
                    <span>🛡️</span>
                  </>
                )}
              </button>

              {alumno.habilidades.length === 0 && (
                <p className="text-center text-xs text-[var(--text-muted)]">
                  Agregá al menos una habilidad para continuar
                </p>
              )}
            </form>
          </div>
        )}

        {/* Footer informativo */}
        <div className="mt-10 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Mapa Productivo impulsado por{' '}
            <span className="text-blue-400 font-semibold">ITEC Saladillo</span>
            {' '}· Ciencia, Tecnología y Comunidad
          </p>
        </div>

      </main>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  )
}

function Divider({ accent = 'blue' }: { accent?: 'blue' | 'amber' }) {
  const color = accent === 'blue'
    ? 'from-transparent via-blue-500/20 to-transparent'
    : 'from-transparent via-amber-500/20 to-transparent'
  return <div className={`h-px bg-gradient-to-r ${color}`} />
}

function Spinner({ color = 'light' }: { color?: 'light' | 'dark' }) {
  return (
    <svg
      className={`animate-spin w-4 h-4 ${color === 'dark' ? 'text-slate-800' : 'text-white'}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// Clase base para inputs
const inputClass = `
  w-full bg-white/[0.03] border border-[var(--border-subtle)] rounded-xl
  px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]
  focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5
  transition-all duration-200
`.trim()
