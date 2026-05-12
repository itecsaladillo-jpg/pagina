import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: { index: false, follow: false },
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
const CATEGORIA_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ciencia:       { bg: 'bg-violet-500/10',  text: 'text-violet-300', label: 'Ciencia' },
  robotica:      { bg: 'bg-blue-500/10',    text: 'text-blue-300',   label: 'Robótica' },
  capacitacion:  { bg: 'bg-amber-500/10',   text: 'text-amber-300',  label: 'Capacitación' },
  traslado:      { bg: 'bg-emerald-500/10', text: 'text-emerald-300',label: 'Logística' },
  equipamiento:  { bg: 'bg-rose-500/10',    text: 'text-rose-300',   label: 'Equipamiento' },
  general:       { bg: 'bg-white/10',       text: 'text-gray-300',   label: 'Acción ITEC' },
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default async function SponsorPortalPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!sponsor) notFound()

  // Obtener el reporte más reciente del sponsor
  const { data: reporte } = await supabase
    .from('sponsor_reportes')
    .select('*')
    .eq('sponsor_id', sponsor.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Obtener todas las acciones del período (si hay reporte), o las últimas 6
  let acciones: any[] = []
  if (reporte?.acciones_ids?.length) {
    const { data } = await supabase
      .from('acciones_itec')
      .select('*')
      .in('id', reporte.acciones_ids)
      .order('fecha', { ascending: false })
    acciones = data || []
  } else {
    const { data } = await supabase
      .from('acciones_itec')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(6)
    acciones = data || []
  }

  // Acciones que coinciden con el rubro del sponsor (invitaciones especiales)
  const accionesDestacadas = sponsor.rubro
    ? acciones.filter(a => a.rubros_relacionados?.includes(sponsor.rubro.toLowerCase()))
    : []

  // Totales
  const totalPresupuesto = acciones.reduce((sum, a) => sum + (a.presupuesto_total || 0), 0)
  const fondoComun = reporte?.fondo_comun_detalle || {}
  const totalFondoComun = Object.values(fondoComun).reduce((sum: number, v: any) => sum + (parseFloat(v) || 0), 0)
  const periodo = reporte?.periodo || new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans antialiased">
      
      {/* Gradiente de fondo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      {/* ─── HEADER ─── */}
      <header className="relative z-10 border-b border-white/5 px-6 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="opacity-60 hover:opacity-100 transition-opacity">
            <Image src="/logoitectrans_v2.png" alt="ITEC" width={100} height={38} className="h-8 w-auto object-contain" />
          </Link>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.35em] text-gray-500">Reporte de Impacto</p>
            <p className="text-[11px] text-white/80 capitalize font-medium">{periodo}</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 space-y-24">

        {/* ─── HERO ─── */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-300 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Socio Estratégico ITEC
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Gracias a tu aporte, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              transformamos Saladillo
            </span>
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed">
            Tu respaldo mensual financió estas acciones concretas que construyen 
            el futuro técnico y productivo de nuestra ciudad.
          </p>

          {/* Firma */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="w-10 h-[1px] bg-white/20" />
            <p className="text-gray-500 text-sm font-medium">{sponsor.name}</p>
            <div className="w-10 h-[1px] bg-white/20" />
          </div>
        </section>

        {/* ─── MÉTRICAS GLOBALES ─── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-gray-500 mb-6 text-center">
            Impacto Consolidado del Período
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Acciones Ejecutadas', value: acciones.length, unit: '' },
              { label: 'Inversión Total', value: formatCurrency(totalPresupuesto), unit: '' },
              { label: 'Personas Impactadas', value: sponsor.impact_data?.alumnos || '—', unit: '' },
              { label: 'Horas de Formación', value: `${sponsor.impact_data?.horas || 0}`, unit: 'hs' },
            ].map((m, i) => (
              <div key={i} className="border border-white/5 rounded-2xl p-6 text-center bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <p className="text-2xl md:text-3xl font-bold mb-2">{m.value}<span className="text-sm text-gray-500">{m.unit}</span></p>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 leading-tight">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── ACCIONES CONCRETAS ─── */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">En qué se transformó tu aporte</h2>
            <p className="text-gray-400 text-sm">Cada peso invertido tuvo un destino concreto y verificable.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acciones.map((accion) => {
              const cat = CATEGORIA_COLORS[accion.categoria] || CATEGORIA_COLORS.general
              return (
                <div key={accion.id} className="group border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all">
                  {/* Foto o placeholder */}
                  {accion.galeria_fotos?.[0] ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img src={accion.galeria_fotos[0]} alt={accion.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-white/5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat.bg}`}>
                        <span className={`text-2xl ${cat.text}`}>
                          {accion.categoria === 'ciencia' ? '🔬' : 
                           accion.categoria === 'robotica' ? '🤖' :
                           accion.categoria === 'capacitacion' ? '📚' :
                           accion.categoria === 'traslado' ? '✈️' :
                           accion.categoria === 'equipamiento' ? '🛠️' : '⚡'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                        {cat.label}
                      </span>
                      {accion.presupuesto_total > 0 && (
                        <span className="text-[10px] text-gray-500 font-mono">
                          {formatCurrency(accion.presupuesto_total)}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white leading-tight">{accion.titulo}</h3>
                    
                    {accion.impacto_social && (
                      <p className="text-blue-300 text-xs font-medium border-l-2 border-blue-500/40 pl-3">
                        {accion.impacto_social}
                      </p>
                    )}
                    
                    {accion.descripcion && (
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                        {accion.descripcion}
                      </p>
                    )}

                    {accion.trascendencia_regional && (
                      <p className="text-gray-500 text-[10px] italic">
                        {accion.trascendencia_regional}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── TRANSPARENCIA DEL FONDO COMÚN ─── */}
        {totalFondoComun > 0 && (
          <section className="border border-white/5 rounded-3xl p-8 bg-white/[0.02]">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 013 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">Transparencia de Gestión</h2>
                <p className="text-gray-400 text-sm">Tu aporte sostiene la logística profesional que hace posible cada acción.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Viáticos', key: 'viaticos' },
                { label: 'Hotelería', key: 'hoteleria' },
                { label: 'Insumos', key: 'insumos' },
                { label: 'Otros', key: 'otros' },
              ].map((item) => {
                const val = parseFloat(fondoComun[item.key] || 0)
                const pct = totalFondoComun > 0 ? Math.round((val / totalFondoComun) * 100) : 0
                return (
                  <div key={item.key} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500">{item.label}</span>
                      <span className="text-[10px] text-gray-400">{pct}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-sm font-bold">{formatCurrency(val)}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ─── INVITACIONES ESPECIALES ─── */}
        {accionesDestacadas.length > 0 && (
          <section className="border border-amber-500/20 rounded-3xl p-8 bg-amber-500/[0.03]">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-300 mb-1">Beneficio Exclusivo para tu Organización</h2>
                <p className="text-amber-300/60 text-sm">
                  Identificamos actividades vinculadas al rubro de {sponsor.name}. Tu equipo tiene acceso preferencial.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {accionesDestacadas.map((a) => (
                <div key={a.id} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg flex-shrink-0">📌</div>
                  <div>
                    <p className="font-semibold text-white text-sm">{a.titulo}</p>
                    <p className="text-gray-400 text-xs">{a.impacto_social}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── REPORTE IA ─── */}
        {reporte?.ai_reporte && (
          <section className="max-w-3xl mx-auto text-center space-y-6">
            <div className="w-px h-16 bg-gradient-to-b from-transparent to-white/20 mx-auto" />
            <blockquote className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed italic">
              "{reporte.ai_reporte}"
            </blockquote>
            <p className="text-[10px] uppercase tracking-widest text-gray-600">Análisis de impacto — ITEC Augusto Cicaré</p>
          </section>
        )}

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image src="/logoitectrans_v2.png" alt="ITEC" width={80} height={30} className="opacity-30 h-7 w-auto object-contain" />
            <p className="text-gray-600 text-xs">ITEC Augusto Cicaré · Saladillo, Buenos Aires</p>
          </div>
          <p className="text-gray-700 text-[10px] uppercase tracking-wider">Reporte confidencial · No indexado</p>
        </footer>
      </main>
    </div>
  )
}
