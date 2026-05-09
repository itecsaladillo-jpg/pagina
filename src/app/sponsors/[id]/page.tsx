import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Evitar indexación en buscadores
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SponsorPortalPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!sponsor) notFound()

  const impact = sponsor.impact_data || {}

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[var(--accent-primary)] selection:text-black overflow-hidden font-sans">
      {/* Fondo con gradiente sutil y textura */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e3a8a33,transparent)] pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

      {/* Header Premium */}
      <header className="relative z-10 p-8 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/">
          <Image src="/logoitectrans.png" alt="ITEC" width={120} height={45} className="opacity-80 hover:opacity-100 transition-opacity" />
        </Link>
        <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] border-l border-white/20 pl-6">
          Portal de Transparencia <br /> Alianzas Estratégicas
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-32">
        {/* Hero Section */}
        <div className="text-center mb-24 space-y-6">
          <h2 className="text-[var(--accent-primary-2)] text-xs font-bold uppercase tracking-[0.4em] animate-fade-in">
            Reconocimiento de Alianza
          </h2>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Gracias, <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{sponsor.name}</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Vuestra apuesta por la formación técnica avanzada fortalece el ecosistema industrial y tecnológico de la región.
          </p>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          <div className="glass-card p-10 text-center border-white/5 hover:border-[var(--accent-primary)]/30 transition-all group">
            <p className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">{impact.alumnos || 0}</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Alumnos Alcanzados</p>
          </div>
          <div className="glass-card p-10 text-center border-white/5 hover:border-[var(--accent-primary)]/30 transition-all group">
            <p className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">{impact.capacitaciones || 0}</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Capacitaciones Apoyadas</p>
          </div>
          <div className="glass-card p-10 text-center border-white/5 hover:border-[var(--accent-primary)]/30 transition-all group">
            <p className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">{impact.horas || 0}h</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Horas de Formación</p>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="glass-card p-12 relative overflow-hidden border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[var(--accent-primary)]"></span>
            Resumen de Logros Alcanzados
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-[var(--text-secondary)] leading-relaxed italic text-lg">
              "{sponsor.ai_summary || 'Procesando el impacto de la última etapa formativa...'}"
            </p>
          </div>
        </div>

        {/* Cicaré Quote / Backing */}
        <div className="mt-32 flex flex-col md:flex-row items-center gap-12 border-t border-white/10 pt-16">
          <div className="w-32 h-32 relative grayscale opacity-40">
             <Image src="/logoitectrans.png" alt="Sello ITEC" fill className="object-contain" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed font-light">
              "El ITEC Augusto Cicaré sostiene su excelencia gracias al compromiso de organizaciones que entienden que el futuro es técnico, innovador y colaborativo."
            </p>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-white font-bold">Respaldo Institucional ITEC</p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
