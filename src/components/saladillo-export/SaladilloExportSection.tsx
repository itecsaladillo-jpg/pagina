'use client'

import { useState, useMemo, useRef, type ReactNode } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, GraduationCap, Briefcase, Globe, Send, X, CheckCircle2, Star } from 'lucide-react'
import { crearTestimonioSaladilloExport } from '@/app/actions/saladillo-export'
import type { TestimonioSaladilloExport } from '@/lib/data/saladillo-export'

interface SaladilloExportSectionProps {
  embajadores: TestimonioSaladilloExport[]
  testimonios: TestimonioSaladilloExport[]
}

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StatCounter({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-black text-white mb-1">{value}</div>
      <div className="text-[var(--text-secondary)] text-xs uppercase tracking-widest">{label}</div>
    </div>
  )
}

function EmbajadorCard({ embajador, index }: { embajador: TestimonioSaladilloExport; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Reveal delay={index * 0.12}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative glass rounded-3xl overflow-hidden border border-amber-400/20 group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/30 shadow-lg shadow-amber-500/10">
                <Image
                  src={embajador.foto_url}
                  alt={embajador.nombre}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-white font-bold text-lg leading-tight">{embajador.nombre}</h3>
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-400/30">
                  <Star className="w-2.5 h-2.5 fill-amber-300" />
                  Embajador ITEC
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs mb-1">
                <Briefcase className="w-3 h-3 shrink-0" />
                {embajador.profesion_rol}
              </div>
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
                <MapPin className="w-3 h-3 shrink-0" />
                {embajador.ciudad_residencia}, {embajador.pais_residencia}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-2">
          <div className="flex items-center gap-1.5 text-amber-400/70 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
            <GraduationCap className="w-3 h-3" />
            Formación en Saladillo
          </div>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{embajador.escuela_origen}</p>
        </div>

        <div className="px-6 pb-6 pt-3">
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
            <p className={`text-[var(--text-secondary)] text-sm leading-relaxed italic ${!expanded ? 'line-clamp-3' : ''}`}>
              &ldquo;{embajador.mensaje_gratitud}&rdquo;
            </p>
            {embajador.mensaje_gratitud.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-amber-400/80 text-[10px] font-semibold mt-2 hover:text-amber-300 transition-colors"
              >
                {expanded ? 'Leer menos' : 'Leer más'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </Reveal>
  )
}

function TestimonioCard({ testimonio, index }: { testimonio: TestimonioSaladilloExport; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="glass rounded-2xl overflow-hidden border border-[var(--border-subtle)] group hover:border-[var(--border-glow)] transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
        <Image
          src={testimonio.foto_url}
          alt={testimonio.nombre}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="text-white font-bold text-sm leading-tight">{testimonio.nombre}</h4>
          <div className="flex items-center gap-1 text-[var(--text-secondary)] text-[10px] mt-0.5">
            <Briefcase className="w-2.5 h-2.5" />
            {testimonio.profesion_rol}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1 text-[var(--text-muted)] text-[10px] mb-2">
          <MapPin className="w-2.5 h-2.5" />
          {testimonio.ciudad_residencia}, {testimonio.pais_residencia}
        </div>

        <div className="flex items-center gap-1 text-amber-400/60 text-[10px] font-medium mb-3">
          <GraduationCap className="w-2.5 h-2.5" />
          <span className="truncate">{testimonio.escuela_origen}</span>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
          <p className={`text-[var(--text-secondary)] text-xs leading-relaxed italic ${!expanded ? 'line-clamp-3' : ''}`}>
            &ldquo;{testimonio.mensaje_gratitud}&rdquo;
          </p>
          {testimonio.mensaje_gratitud.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[var(--accent-primary-2)] text-[10px] font-semibold mt-1.5 hover:text-[var(--accent-cyan-2)] transition-colors"
            >
              {expanded ? 'Leer menos' : 'Leer más'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function RegistroForm({ onSubmitted }: { onSubmitted: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setFotoPreview(url)
    } else {
      setFotoPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(formRef.current!)

    try {
      const result = await crearTestimonioSaladilloExport(fd)
      if (result.success) {
        formRef.current?.reset()
        setFotoPreview(null)
        onSubmitted()
      } else {
        setError(result.error || 'Error al enviar.')
      }
    } catch {
      setError('Error de conexión.')
    }
    setLoading(false)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 border border-[var(--border-subtle)]">
      <h3 className="text-white font-bold text-xl mb-1">Registra tu huella</h3>
      <p className="text-[var(--text-secondary)] text-sm mb-6">Compartí tu historia y celebrá tus raíces saladillenses.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Nombre completo *</label>
          <input name="nombre" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Tu nombre" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Foto de perfil *</label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/15 rounded-xl px-4 py-2.5 text-[var(--text-secondary)] text-sm cursor-pointer hover:border-[var(--accent-primary)]/40 hover:bg-white/[0.07] transition-colors">
              <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" required className="hidden" onChange={handleFotoChange} />
              {fotoPreview ? (
                <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Foto seleccionada</span>
              ) : (
                <span>Elegí tu foto</span>
              )}
            </label>
            {fotoPreview && (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Ciudad actual *</label>
          <input name="ciudad_residencia" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Ej: Madrid, Buenos Aires..." />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">País actual *</label>
          <input name="pais_residencia" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Ej: España, Argentina..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Escuela/s de Saladillo *</label>
          <input name="escuela_origen" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Ej: EEST N°1, CURS..." />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Profesión / Rol *</label>
          <input name="profesion_rol" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Ej: Ingeniero, Diseñador..." />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Mensaje de gratitud a tus formadores *</label>
        <textarea name="mensaje_gratitud" required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)] resize-none" placeholder="¿Qué aprendiste en Saladillo? ¿A quién te gustaría agradecer?" />
      </div>

      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      <button type="submit" disabled={loading} className="w-full btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-40">
        {loading ? 'Enviando...' : (
          <span className="flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            Enviar testimonio
          </span>
        )}
      </button>
    </form>
  )
}

export function SaladilloExportSection({ embajadores, testimonios }: SaladilloExportSectionProps) {
  const [search, setSearch] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const uniqueCountries = useMemo(() => {
    const set = new Set(testimonios.map(t => t.pais_residencia))
    embajadores.forEach(e => set.add(e.pais_residencia))
    return set.size
  }, [testimonios, embajadores])

  const totalConnected = embajadores.length + testimonios.length

  const filteredTestimonios = useMemo(() => {
    if (!search.trim()) return testimonios
    const q = search.toLowerCase()
    return testimonios.filter(t =>
      t.ciudad_residencia.toLowerCase().includes(q) ||
      t.pais_residencia.toLowerCase().includes(q) ||
      t.escuela_origen.toLowerCase().includes(q)
    )
  }, [testimonios, search])

  return (
    <section id="saladillo-for-export" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-amber-600/8 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* ═══ HERO ═══ */}
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-amber-400 uppercase px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 mb-5">
              Saladillo for Export
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-5">
              Orgullo <span className="text-gradient">saladillense</span>
              <br />
              donde sea que estés
            </h2>
            <p className="text-[var(--text-secondary)] text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Raíces que nacen en Saladillo, voces que resuenan por el mundo.
              <br className="hidden md:block" />
              Cada testimonio es un hilo que conecta la formación local con el impacto global.
            </p>

            <div className="flex items-center justify-center gap-10 md:gap-16 mt-10">
              <StatCounter value={totalConnected} label="Conectados" />
              <div className="w-px h-10 bg-white/10" />
              <StatCounter value={uniqueCountries} label="Países" />
            </div>
          </div>
        </Reveal>

        <div className="section-divider mb-16" />

        {/* ═══ EMBAJADORES ═══ */}
        {embajadores.length > 0 && (
          <>
            <Reveal>
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 mb-4">
                  <Star className="w-3 h-3 fill-amber-300" />
                  Embajadores ITEC
                </span>
                <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">
                  Los que llevan <span className="text-gradient">Saladillo</span> al mundo
                </h3>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
              {embajadores.map((emb, i) => (
                <EmbajadorCard key={emb.id} embajador={emb} index={i} />
              ))}
            </div>
          </>
        )}

        <div className="section-divider mb-16" />

        {/* ═══ MURO ═══ */}
        <Reveal>
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              El muro <span className="text-gradient">Saladillo</span>
            </h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-lg mx-auto">
              Testimonios de saladillenses que forjaron su camino desde la formación local.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="relative max-w-md mx-auto mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por país, ciudad o escuela..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)] placeholder:text-[var(--text-muted)]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </Reveal>

        {filteredTestimonios.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-16 glass rounded-2xl border border-[var(--border-subtle)]">
            {search ? 'No se encontraron testimonios con ese criterio.' : 'Aún no hay testimonios aprobados.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTestimonios.map((t, i) => (
                <TestimonioCard key={t.id} testimonio={t} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="section-divider my-20" />

        {/* ═══ FORMULARIO ═══ */}
        <Reveal>
          <div className="max-w-2xl mx-auto">
            {showSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-10 text-center border border-emerald-500/20"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 shadow-[0_0_24px_-4px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold text-xl mb-3">¡Gracias por registrar tu huella!</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Tu testimonio será revisado y publicado en breve. Cada historia suma al orgullo saladillense.
                </p>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="btn-outline py-2.5 px-6 rounded-xl text-sm font-semibold"
                >
                  Enviar otro testimonio
                </button>
              </motion.div>
            ) : (
              <RegistroForm onSubmitted={() => setShowSuccess(true)} />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
