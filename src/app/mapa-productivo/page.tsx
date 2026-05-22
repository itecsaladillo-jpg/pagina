import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

// ─── SEO ─────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Mapa Productivo · ITEC Saladillo',
  description:
    'Conectamos empresas locales y alumnos técnicos avanzados para impulsar el desarrollo productivo de Saladillo a través de la innovación colaborativa.',
}

// ─── Datos de contenido ───────────────────────────────────────────────────────

const beneficiosEmpresa = [
  {
    icon: '🏪',
    titulo: 'Ganás visibilidad real',
    descripcion:
      'Registrá tu oferta comercial y hacé que otras empresas, emprendimientos e instituciones del partido te encuentren fácilmente.',
  },
  {
    icon: '🔗',
    titulo: 'Encontrá proveedores locales',
    descripcion:
      'Cargá los insumos que necesitás y conectate con quienes ya los producen a pocos kilómetros de tu empresa.',
  },
  {
    icon: '🔒',
    titulo: 'Desafíos tecnológicos 100% privados',
    descripcion:
      'Subí tus problemas de producción o tecnología de forma confidencial. Solo docentes y alumnos autorizados verán el desafío para ayudarte a resolverlo.',
  },
]

const beneficiosAlumno = [
  {
    icon: '🛡️',
    titulo: 'Visibilizate con total privacidad',
    descripcion:
      'Mostrá tus habilidades técnicas de forma anónima. Tu nombre nunca se expone: solo tus capacidades llegan a las empresas.',
  },
  {
    icon: '📂',
    titulo: 'Accedé a proyectos reales',
    descripcion:
      'Consultá el banco cerrado de desafíos tecnológicos de las industrias locales y trabajá en problemas con impacto concreto en tu comunidad.',
  },
  {
    icon: '🔔',
    titulo: 'Alertas de oportunidades',
    descripcion:
      'Recibí notificaciones automáticas cuando una empresa local necesite exactamente el talento que vos tenés.',
  },
]

const estadisticas = [
  { valor: '60+', label: 'Empresas del partido' },
  { valor: '3',   label: 'Escuelas técnicas' },
  { valor: '∞',   label: 'Proyectos posibles' },
]

// ─── Componentes internos ─────────────────────────────────────────────────────

function BeneficioItem({
  icon,
  titulo,
  descripcion,
}: {
  icon: string
  titulo: string
  descripcion: string
}) {
  return (
    <li className="flex items-start gap-4">
      <span
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl
          bg-white/[0.04] border border-white/[0.07]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{titulo}</p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{descripcion}</p>
      </div>
    </li>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function MapaProductivoPage() {
  return (
    <div className="min-h-screen grid-bg text-[var(--text-primary)] overflow-x-hidden">
      <Navbar />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative pt-8 pb-24 px-6 text-center overflow-hidden">

        {/* Orbe de fondo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{
              background: 'radial-gradient(circle, #3b82f6 0%, #06b6d4 40%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Etiqueta */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20
            rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />
            <span className="text-blue-300 text-sm font-medium tracking-wide">
              Mapa Productivo · ITEC Saladillo
            </span>
          </div>

          {/* Título principal */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
            El mapa de la{' '}
            <span className="text-gradient">innovación</span> y el{' '}
            <span className="text-gradient">talento</span> de Saladillo.
          </h1>

          {/* Subtítulo */}
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed max-w-3xl mx-auto mb-6">
            Mapeamos la oferta, demanda y desafíos de nuestro sector privado para conectarlo
            de forma inteligente con el talento de las escuelas técnicas.
            Impulsamos el desarrollo local a través de la <strong className="text-[var(--text-primary)]">
            innovación colaborativa</strong>.
          </p>

          {/* Fila de Estadísticas a la izquierda y CTA a la derecha */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mt-8 w-full border-t border-white/[0.05] pt-6">
            {/* Estadísticas a la izquierda */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-x-12 gap-y-6 text-center sm:text-left">
              {estadisticas.map(({ valor, label }) => (
                <div key={label} className="flex flex-col items-center sm:items-start">
                  <p className="text-4xl font-black text-gradient leading-none">{valor}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5 uppercase tracking-widest font-bold max-w-[140px] sm:max-w-none">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA principal a la derecha */}
            <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-right">
              <Link
                href="/registro-mapa"
                id="cta-hero-registro"
                className="btn-primary inline-flex text-base px-8 py-4 animate-pulse-glow w-full sm:w-auto justify-center"
              >
                <span>Sumate al Mapa Productivo</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Divisor */}
      <div className="section-divider mx-6 sm:mx-12" />

      {/* ══════════════════════════════════════════════
          LOS DOS CAMINOS
      ══════════════════════════════════════════════ */}
      <section className="py-20 px-6" aria-labelledby="dos-caminos-titulo">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
              ¿Quién sos?
            </p>
            <h2
              id="dos-caminos-titulo"
              className="text-3xl sm:text-4xl font-black leading-tight"
            >
              Dos caminos,{' '}
              <span className="text-gradient">un mismo ecosistema</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ─── Columna Empresa ─── */}
            <article
              id="card-empresas"
              className="glass card-hover rounded-3xl border border-blue-500/15 overflow-hidden"
            >
              {/* Header de tarjeta */}
              <div className="bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-transparent
                px-8 py-7 border-b border-blue-500/10">
                <div className="flex items-center gap-4 mb-3">
                  <span className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20
                    flex items-center justify-center text-2xl flex-shrink-0">
                    🏭
                  </span>
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-0.5">
                      Sector Privado
                    </p>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                      Para Empresas y Emprendimientos
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Hacé que tu empresa sea parte del tejido productivo digital de Saladillo.
                  Conectate, abastecete y resolvé tus problemas tecnológicos con el ecosistema local.
                </p>
              </div>

              {/* Lista de beneficios */}
              <div className="px-8 py-7">
                <ul className="space-y-6">
                  {beneficiosEmpresa.map(b => (
                    <BeneficioItem key={b.titulo} {...b} />
                  ))}
                </ul>

                {/* Tag de privacidad */}
                <div className="mt-8 flex items-center gap-2 text-xs text-slate-400
                  bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3">
                  <span>🔒</span>
                  <span>Tus desafíos tecnológicos son <strong className="text-slate-300">estrictamente confidenciales</strong></span>
                </div>
              </div>
            </article>

            {/* ─── Columna Alumno ─── */}
            <article
              id="card-alumnos"
              className="glass card-hover rounded-3xl border border-amber-500/15 overflow-hidden"
            >
              {/* Header de tarjeta */}
              <div className="bg-gradient-to-br from-amber-600/20 via-amber-600/10 to-transparent
                px-8 py-7 border-b border-amber-500/10">
                <div className="flex items-center gap-4 mb-3">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/20
                    flex items-center justify-center text-2xl flex-shrink-0">
                    🎓
                  </span>
                  <div>
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-0.5">
                      Talento Técnico
                    </p>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                      Para Alumnos Técnicos Avanzados
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Tus habilidades tienen valor real en la industria local. Mostrátelas de forma
                  segura y trabajá en proyectos que impactan tu ciudad.
                </p>
              </div>

              {/* Lista de beneficios */}
              <div className="px-8 py-7">
                <ul className="space-y-6">
                  {beneficiosAlumno.map(b => (
                    <BeneficioItem key={b.titulo} {...b} />
                  ))}
                </ul>

                {/* Tag de anonimato */}
                <div className="mt-8 flex items-center gap-2 text-xs text-amber-300/60
                  bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                  <span>🛡️</span>
                  <span>Tu identidad estará <strong className="text-amber-300/90">siempre protegida</strong>. Solo se publican tus habilidades técnicas.</span>
                </div>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* Divisor */}
      <div className="section-divider mx-6 sm:mx-12" />

      {/* ══════════════════════════════════════════════
          CÓMO FUNCIONA (pasos)
      ══════════════════════════════════════════════ */}
      <section className="py-20 px-6" aria-labelledby="como-funciona-titulo">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
            Simple y rápido
          </p>
          <h2
            id="como-funciona-titulo"
            className="text-3xl sm:text-4xl font-black mb-14"
          >
            ¿Cómo funciona?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: '01', icon: '✍️', titulo: 'Registrarte', desc: 'Completá el formulario en menos de 3 minutos. Sin burocracia, sin cuentas extra.' },
              { n: '02', icon: '🗺️', titulo: 'Aparecer en el Mapa', desc: 'Tu perfil o empresa queda visible en el ecosistema productivo de Saladillo al instante.' },
              { n: '03', icon: '🤝', titulo: 'Conectarte', desc: 'ITEC facilita el match entre empresas y alumnos para que la colaboración ocurra de verdad.' },
            ].map(paso => (
              <div
                key={paso.n}
                className="glass rounded-2xl border border-[var(--border-subtle)] p-7
                  flex flex-col items-center text-center card-hover"
              >
                <span className="text-4xl mb-4" aria-hidden="true">{paso.icon}</span>
                <span className="text-xs font-black text-[var(--text-muted)] tracking-widest mb-2">
                  PASO {paso.n}
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{paso.titulo}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divisor */}
      <div className="section-divider mx-6 sm:mx-12" />

      {/* ══════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 overflow-hidden" aria-labelledby="cta-titulo">

        {/* Fondo decorativo */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="w-[700px] h-[300px] opacity-[0.06]"
            style={{
              background: 'radial-gradient(ellipse, #f59e0b 0%, #3b82f6 50%, transparent 75%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">
            El momento es ahora
          </p>
          <h2
            id="cta-titulo"
            className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6"
          >
            Sumá tu voz al{' '}
            <span className="text-gradient">Mapa Productivo</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg mb-10 leading-relaxed">
            Empresa, emprendimiento o estudiante técnico: hay un lugar para vos.
            Registrarte es gratis, toma 3 minutos y conecta tu talento o negocio
            con toda la comunidad.
          </p>

          <Link
            href="/registro-mapa"
            id="cta-final-registro"
            className="btn-primary inline-flex text-lg px-10 py-5 animate-pulse-glow"
          >
            <span>Sumate al Mapa Productivo</span>
            <span aria-hidden="true" className="text-xl">🗺️</span>
          </Link>

          <p className="mt-5 text-xs text-[var(--text-muted)]">
            Una iniciativa de{' '}
            <span className="text-blue-400 font-semibold">ITEC Saladillo</span>
            {' '}· Ciencia, Tecnología y Comunidad
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
