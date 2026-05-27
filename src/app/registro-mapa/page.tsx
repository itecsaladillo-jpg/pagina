'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Perfil = 'empresa' | 'alumno' | null

interface EmpresaForm {
  nombre: string
  rubro: string
  email: string
  telefono: string
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
  { id: 'ventas',      label: 'Agente de Ventas',           icon: '🤝' },
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
  const { language, dict } = useLanguage()
  const [perfil, setPerfil] = useState<Perfil>(null)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState<Perfil>(null)
  const [error, setError] = useState<string | null>(null)

  // Estado empresa
  const [empresa, setEmpresa] = useState<EmpresaForm>({
    nombre: '',
    rubro: '',
    email: '',
    telefono: '',
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

  // ─── Traductores auxiliares ─────────────────────────────────────────────────
  const translateCategoria = (id: string, defaultLabel: string) => {
    if (language === 'en') {
      if (id === 'logistica') return 'Logistics'
      if (id === 'packaging') return 'Packaging'
      if (id === 'electronica') return 'Electronic Components'
      if (id === 'software') return 'Software Development'
      if (id === 'marketing') return 'Marketing & Design'
      if (id === 'ventas') return 'Sales Agent'
    } else if (language === 'pt') {
      if (id === 'logistica') return 'Logística'
      if (id === 'packaging') return 'Embalagem'
      if (id === 'electronica') return 'Componentes Eletrônicos'
      if (id === 'software') return 'Desenvolvimento de Software'
      if (id === 'marketing') return 'Marketing e Design'
      if (id === 'ventas') return 'Agente de Vendas'
    }
    return defaultLabel
  }

  const translateEscuela = (esc: string) => {
    if (language !== 'es' && esc === 'Otra escuela técnica') {
      return language === 'en' ? 'Other technical school' : 'Outra escola técnica'
    }
    return esc
  }

  const translateEspecialidad = (esp: string) => {
    if (language === 'en') {
      if (esp === 'Electrónica') return 'Electronics'
      if (esp === 'Electromecánica') return 'Electromechanics'
      if (esp === 'Informática') return 'Computer Science'
      if (esp === 'Química') return 'Chemistry'
      if (esp === 'Construcciones') return 'Construction'
      if (esp === 'Maestro Mayor de Obras') return 'Master Builder'
      if (esp === 'Administración') return 'Administration'
      if (esp === 'Otra') return 'Other'
    } else if (language === 'pt') {
      if (esp === 'Electrónica') return 'Eletrônica'
      if (esp === 'Electromecánica') return 'Eletromecânica'
      if (esp === 'Informática') return 'Informática'
      if (esp === 'Química') return 'Química'
      if (esp === 'Construcciones') return 'Construção'
      if (esp === 'Maestro Mayor de Obras') return 'Mestre de Obras'
      if (esp === 'Administración') return 'Administração'
      if (esp === 'Otra') return 'Outra'
    }
    return esp
  }

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
        telefono: empresa.telefono,
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
          <Link href="/" className="inline-block mb-6 cursor-pointer hover:opacity-80 transition-opacity">
            <Image src="/logoitectrans_v2.png" alt="ITEC" width={110} height={35} className="mx-auto" />
          </Link>
          <div className="text-6xl mb-6">
            {exito === 'empresa' ? '🏭' : '🎓'}
          </div>
          <h2 className="text-2xl font-bold text-gradient mb-3">
            {dict.registroMapa.exitoTitulo}
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            {exito === 'empresa'
              ? dict.registroMapa.exitoEmpresa
              : dict.registroMapa.exitoAlumno}
          </p>
          <button
            onClick={() => { setExito(null); setPerfil(null) }}
            className="btn-primary w-full justify-center"
          >
            <span>{dict.registroMapa.exitoCta}</span>
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
        <Link href="/" className="inline-block mb-6 cursor-pointer hover:opacity-80 transition-opacity">
          <Image 
            src="/logoitectrans_v2.png" 
            alt="Logo ITEC" 
            width={140} 
            height={45} 
            className="mx-auto"
            priority
          />
        </Link>
        <br />
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-300 text-sm font-medium tracking-wide">{dict.registroMapa.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gradient mb-3">
          {dict.registroMapa.heading}
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-xl mx-auto">
          {dict.registroMapa.desc}
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
              {dict.registroMapa.perfilEmpresa.title}
              {perfil === 'empresa' && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">✓</span>
              )}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              {dict.registroMapa.perfilEmpresa.desc}
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
              <span>{dict.registroMapa.ctaComenzar}</span>
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
              {dict.registroMapa.perfilAlumno.title}
              {perfil === 'alumno' && (
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">✓</span>
              )}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              {dict.registroMapa.perfilAlumno.desc}
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
              <span>{dict.registroMapa.ctaComenzar}</span>
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
                {dict.registroMapa.empresaForm.title}
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                {dict.registroMapa.empresaForm.subtitle}
              </p>
              
              {/* Leyenda de privacidad al inicio */}
              <div className="flex items-start gap-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-4 mt-4 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
                <span className="text-xl flex-shrink-0 mt-0.5 animate-pulse">🔒</span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  <strong className="text-blue-400 font-bold text-sm block mb-1">
                    {language === 'en' ? 'Private Information' : language === 'pt' ? 'Informação Privada' : 'Esta información es privada'}
                  </strong>
                  {dict.registroMapa.leyendaPrivacidad}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitEmpresa} className="p-8 space-y-8">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Sección 1: Datos generales */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-white/5 pb-2">
                  {dict.registroMapa.empresaForm.datosOrg}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                      {dict.registroMapa.empresaForm.nombre} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={empresa.nombre}
                      onChange={handleEmpresaChange}
                      className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus:border-blue-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                      {dict.registroMapa.empresaForm.rubro} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="rubro"
                      required
                      placeholder="Ej. Metalúrgica, Agro, Software"
                      value={empresa.rubro}
                      onChange={handleEmpresaChange}
                      className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus:border-blue-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                      {dict.registroMapa.empresaForm.email} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={empresa.email}
                      onChange={handleEmpresaChange}
                      className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus:border-blue-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                      {dict.registroMapa.empresaForm.telefono} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      required
                      value={empresa.telefono}
                      onChange={handleEmpresaChange}
                      className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus:border-blue-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                    {dict.registroMapa.empresaForm.direccion} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    required
                    placeholder="Ej. Av. Rivadavia 1234"
                    value={empresa.direccion}
                    onChange={handleEmpresaChange}
                    className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus:border-blue-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Sección 2: Oferta y Demanda */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-white/5 pb-2">
                  {dict.registroMapa.empresaForm.necesidades}
                </h3>

                <div className="space-y-3">
                  <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                    {dict.registroMapa.empresaForm.necesidadesDesc}
                  </label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIAS_DEMANDA.map((cat) => {
                      const activo = empresa.demanda.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleDemanda(cat.id)}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer
                            ${activo
                              ? 'bg-blue-500/10 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                              : 'bg-white/[0.01] border-white/5 text-[var(--text-secondary)] hover:border-white/10 hover:bg-white/[0.03]'}
                          `}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className="text-xs font-bold leading-tight">
                            {translateCategoria(cat.id, cat.label)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                    {dict.registroMapa.empresaForm.detallesNecesidad}
                  </label>
                  <textarea
                    name="detalles_demanda"
                    rows={3}
                    placeholder={dict.registroMapa.empresaForm.detallesNecesidadPlaceholder}
                    value={empresa.detalles_demanda}
                    onChange={handleEmpresaChange}
                    className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus:border-blue-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                    {dict.registroMapa.empresaForm.oferta} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="oferta"
                    rows={3}
                    required
                    placeholder={dict.registroMapa.empresaForm.ofertaPlaceholder}
                    value={empresa.oferta}
                    onChange={handleEmpresaChange}
                    className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus:border-blue-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)] font-semibold block flex items-center gap-1.5">
                    {dict.registroMapa.empresaForm.desafio}
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {language === 'en' ? 'CO-CREATION' : language === 'pt' ? 'CO-CRIAÇÃO' : 'CO-CREACIÓN'}
                    </span>
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)] block -mt-1 mb-1">
                    {dict.registroMapa.empresaForm.desafioDesc}
                  </span>
                  <textarea
                    name="desafio_tecnologico"
                    rows={3}
                    placeholder={dict.registroMapa.empresaForm.desafioPlaceholder}
                    value={empresa.desafio_tecnologico}
                    onChange={handleEmpresaChange}
                    className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus:border-blue-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={enviando}
                className="btn-primary w-full justify-center py-4 text-sm font-extrabold"
              >
                <span>
                  {enviando ? dict.registroMapa.empresaForm.enviando : dict.registroMapa.empresaForm.botonEnviar}
                </span>
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
            {/* Header del formulario */}
            <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/10 px-8 py-6 border-b border-amber-500/10">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <span className="text-2xl">🎓</span>
                {dict.registroMapa.alumnoForm.title}
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                {dict.registroMapa.alumnoForm.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmitAlumno} className="p-8 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                    {dict.registroMapa.alumnoForm.escuela} <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="escuela"
                    required
                    value={alumno.escuela}
                    onChange={handleAlumnoChange}
                    className="w-full bg-black/40 border border-[var(--border-subtle)] focus:border-amber-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm h-[46px]"
                  >
                    <option value="" disabled className="text-gray-500">
                      {dict.registroMapa.alumnoForm.seleccionarEscuela}
                    </option>
                    {ESCUELAS.map((esc) => (
                      <option key={esc} value={esc} className="bg-gray-950 text-white">
                        {translateEscuela(esc)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                    {dict.registroMapa.alumnoForm.especialidad} <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="especialidad"
                    required
                    value={alumno.especialidad}
                    onChange={handleAlumnoChange}
                    className="w-full bg-black/40 border border-[var(--border-subtle)] focus:border-amber-500 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm h-[46px]"
                  >
                    <option value="" disabled className="text-gray-500">
                      {dict.registroMapa.alumnoForm.seleccionarEspecialidad}
                    </option>
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp} value={esp} className="bg-gray-950 text-white">
                        {translateEspecialidad(esp)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Habilidades interactivo */}
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-secondary)] font-semibold block">
                  {dict.registroMapa.alumnoForm.habilidades} <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-[var(--text-muted)] block -mt-1">
                  {dict.registroMapa.alumnoForm.habilidadesDesc}
                </span>

                <div className="w-full bg-white/[0.02] border border-[var(--border-subtle)] focus-within:border-amber-500 rounded-xl p-2.5 transition-colors">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {alumno.habilidades.map((hab) => (
                      <span
                        key={hab}
                        className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg"
                      >
                        {hab}
                        <button
                          type="button"
                          onClick={() => eliminarHabilidad(hab)}
                          className="hover:text-white transition-colors cursor-pointer text-[10px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    name="habilidades_input"
                    placeholder={alumno.habilidades.length === 0 ? dict.registroMapa.alumnoForm.habilidadesPlaceholder : ''}
                    value={alumno.habilidades_input}
                    onChange={handleAlumnoChange}
                    onKeyDown={handleHabilidadKeyDown}
                    className="w-full bg-transparent border-none text-white focus:outline-none text-sm p-1"
                  />
                </div>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer mt-4"
              >
                <span>
                  {enviando ? dict.registroMapa.alumnoForm.enviando : dict.registroMapa.alumnoForm.botonEnviar}
                </span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
