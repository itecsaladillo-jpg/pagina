"use client"

import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { QRCode } from "react-qr-code"
import { AlertCircle, Cloud, Vote, MessageSquare, Users, ThumbsUp, TrafficCone, Sparkles, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface HerramientasActivas {
  encuestas: boolean
  preguntas: boolean
  nube: boolean
  semaforo: boolean
}

type ModoPantalla = 'bienvenida' | 'nube' | 'encuestas' | 'preguntas'

interface Evento {
  id: string
  nombre_evento: string
  fecha: string
  slug_qr: string
  estado_activo: boolean
  herramienta_activa: string
  encuesta_activa_id: string | null
  nube_activa_id: string | null
  semaforo_last_reset_at: string | null
  herramientas_activas: HerramientasActivas
  modo_pantalla_gigante: ModoPantalla
}

interface OpcionEncuesta {
  id: string
  texto_opcion: string
}

interface Encuesta {
  id: string
  pregunta: string
  opciones: OpcionEncuesta[]
}

interface PalabraNube {
  palabra: string
  cantidad: number
}

interface Pregunta {
  id: string
  nombre: string
  pregunta: string
  likes: number
}

interface EstadoSemaforo {
  totalAcreditados: number
  votosNegativos: number
  porcentajeNegativo: number
  estado: 'VERDE' | 'AMARILLO' | 'ROJO'
}

const PALETA_NUBE = [
  '#06b6d4', // cyan
  '#a78bfa', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f472b6', // pink
  '#60a5fa', // blue
]

export default function PantallaGigantePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const idParam = resolvedParams.id
  const supabase = createClient()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [siteUrl, setSiteUrl] = useState("")

  const [encuestaActiva, setEncuestaActiva] = useState<Encuesta | null>(null)
  const [votosEncuesta, setVotosEncuesta] = useState<Record<string, number>>({})
  const [totalVotos, setTotalVotos] = useState(0)

  const [palabrasNube, setPalabrasNube] = useState<PalabraNube[]>([])

  const [preguntas, setPreguntas] = useState<Pregunta[]>([])

  const [estadoSemaforo, setEstadoSemaforo] = useState<EstadoSemaforo | null>(null)
  const [asistentesCount, setAsistentesCount] = useState(0)

  useEffect(() => {
    setSiteUrl(window.location.origin)
  }, [])

  useEffect(() => {
    if (!idParam) return

    const inicializar = async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from("eventos")
          .select("*")
          .eq("slug_qr", idParam)
          .eq("estado_activo", true)
          .maybeSingle()

        if (error || !data) {
          console.warn("Evento no encontrado o inactivo:", error)
          setLoading(false)
          return
        }

        const ev = {
          ...data,
          herramientas_activas: (data as any).herramientas_activas ?? { encuestas: false, preguntas: false, nube: false, semaforo: false },
          modo_pantalla_gigante: (data as any).modo_pantalla_gigante ?? 'bienvenida',
        } as Evento

        setEvento(ev)
      } catch (err) {
        console.error("Error al cargar evento:", err)
      } finally {
        setLoading(false)
      }
    }

    inicializar()
  }, [idParam, supabase])

  useEffect(() => {
    if (!evento) return

    const fetchAsistentes = async () => {
      const { count } = await supabase
        .from("eventos_asistentes")
        .select("id", { count: "exact" })
        .eq("evento_id", evento.id)
      setAsistentesCount(count || 0)
    }
    fetchAsistentes()

    const asistChannel = supabase
      .channel(`realtime:pantalla_asistentes_${evento.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "eventos_asistentes", filter: `evento_id=eq.${evento.id}` },
        () => setAsistentesCount(prev => prev + 1)
      )
      .subscribe()

    return () => { supabase.removeChannel(asistChannel) }
  }, [evento?.id, supabase])

  useEffect(() => {
    if (!evento) return

    const channel = supabase
      .channel(`realtime:pantalla_evento_${evento.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "eventos", filter: `id=eq.${evento.id}` },
        (payload) => {
          const updated = payload.new as Partial<Evento>
          setEvento(prev => prev ? { ...prev, ...updated } : prev)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [evento?.id, supabase])

  useEffect(() => {
    if (!evento || !evento.encuesta_activa_id || evento.modo_pantalla_gigante !== 'encuestas') {
      setEncuestaActiva(null)
      setVotosEncuesta({})
      setTotalVotos(0)
      return
    }

    const cargarEncuesta = async () => {
      const { data, error } = await supabase
        .from("eventos_encuestas")
        .select(`
          id,
          pregunta,
          eventos_encuestas_opciones (id, texto_opcion)
        `)
        .eq("id", evento.encuesta_activa_id)
        .single()

      if (data && !error) {
        setEncuestaActiva({
          id: data.id,
          pregunta: data.pregunta,
          opciones: (data.eventos_encuestas_opciones || []) as OpcionEncuesta[],
        })

        const opcionesIds = (data.eventos_encuestas_opciones || []).map((o: any) => o.id)
        if (opcionesIds.length > 0) {
          const { data: votos } = await supabase
            .from("eventos_encuestas_votos")
            .select("opcion_id")
            .in("opcion_id", opcionesIds)

          if (votos) {
            const counts: Record<string, number> = {}
            opcionesIds.forEach((id: string) => counts[id] = 0)
            votos.forEach((v: any) => {
              counts[v.opcion_id] = (counts[v.opcion_id] || 0) + 1
            })
            setVotosEncuesta(counts)
            setTotalVotos(votos.length)
          }
        }
      }
    }

    cargarEncuesta()

    const votosChannel = supabase
      .channel(`realtime:pantalla_votos_${evento.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "eventos_encuestas_votos" },
        () => { cargarEncuesta() }
      )
      .subscribe()

    return () => { supabase.removeChannel(votosChannel) }
  }, [evento?.encuesta_activa_id, evento?.modo_pantalla_gigante, supabase])

  useEffect(() => {
    if (!evento || evento.modo_pantalla_gigante !== 'nube') {
      setPalabrasNube([])
      return
    }

    const cargarNube = async () => {
      const { data, error } = await supabase
        .from("eventos_nube_palabras")
        .select("palabra")
        .eq("evento_id", evento.id)

      if (data && !error) {
        const freq: Record<string, number> = {}
        data.forEach((d: any) => {
          const pal = d.palabra.toUpperCase().trim()
          freq[pal] = (freq[pal] || 0) + 1
        })
        const arr = Object.entries(freq).map(([palabra, cantidad]) => ({ palabra, cantidad }))
        arr.sort((a, b) => b.cantidad - a.cantidad)
        setPalabrasNube(arr)
      }
    }

    cargarNube()

    const nubeChannel = supabase
      .channel(`realtime:pantalla_nube_${evento.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eventos_nube_palabras", filter: `evento_id=eq.${evento.id}` },
        () => { cargarNube() }
      )
      .subscribe()

    return () => { supabase.removeChannel(nubeChannel) }
  }, [evento?.id, evento?.modo_pantalla_gigante, supabase])

  useEffect(() => {
    if (!evento || evento.modo_pantalla_gigante !== 'preguntas') {
      setPreguntas([])
      return
    }

    const cargarPreguntas = async () => {
      const { data, error } = await supabase
        .from("eventos_preguntas")
        .select(`
          id, nombre, pregunta,
          eventos_preguntas_likes(count)
        `)
        .eq("evento_id", evento.id)
        .eq("aprobada", true)

      if (data && !error) {
        const formatted = data.map((q: any) => ({
          id: q.id,
          nombre: q.nombre || "Anónimo",
          pregunta: q.pregunta,
          likes: q.eventos_preguntas_likes?.[0]?.count || 0,
        }))
        formatted.sort((a: any, b: any) => b.likes - a.likes)
        setPreguntas(formatted)
      }
    }

    cargarPreguntas()

    const pregChannel = supabase
      .channel(`realtime:pantalla_preg_${evento.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eventos_preguntas", filter: `evento_id=eq.${evento.id}` },
        () => { cargarPreguntas() }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "eventos_preguntas_likes" },
        () => { cargarPreguntas() }
      )
      .subscribe()

    return () => { supabase.removeChannel(pregChannel) }
  }, [evento?.id, evento?.modo_pantalla_gigante, supabase])

  useEffect(() => {
    if (!evento) return

    const fetchSemaforo = async () => {
      const { count: totalAcreditados } = await supabase
        .from("eventos_asistentes")
        .select("*", { count: "exact", head: true })
        .eq("evento_id", evento.id)

      let votosNegativos = 0
      if (evento.semaforo_last_reset_at) {
        const { count } = await supabase
          .from("evento_semaforo_votos")
          .select("*", { count: "exact", head: true })
          .eq("evento_id", evento.id)
          .eq("voto", "negativo")
          .gte("created_at", evento.semaforo_last_reset_at)
        votosNegativos = count ?? 0
      }

      const total = totalAcreditados ?? 0
      const porcentajeNegativo = total === 0 ? 0 : Math.round((votosNegativos / total) * 100)

      let estado: 'VERDE' | 'AMARILLO' | 'ROJO'
      if (porcentajeNegativo < 30) estado = "VERDE"
      else if (porcentajeNegativo < 50) estado = "AMARILLO"
      else estado = "ROJO"

      setEstadoSemaforo({ totalAcreditados: total, votosNegativos, porcentajeNegativo, estado })
    }

    fetchSemaforo()

    const semChannel = supabase
      .channel(`realtime:pantalla_semaforo_${evento.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "evento_semaforo_votos", filter: `evento_id=eq.${evento.id}` },
        () => { fetchSemaforo() }
      )
      .subscribe()

    return () => { supabase.removeChannel(semChannel) }
  }, [evento?.id, evento?.semaforo_last_reset_at, supabase])

  // Forzar re-sincronización al recuperar el foco de la pestaña
  useEffect(() => {
    if (!evento?.id) return

    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return
      const { data } = await supabase
        .from("eventos")
        .select("*")
        .eq("id", evento.id)
        .single()
      if (data) {
        const refreshed = {
          ...data,
          herramientas_activas: (data as any).herramientas_activas ?? evento.herramientas_activas,
          modo_pantalla_gigante: (data as any).modo_pantalla_gigante ?? evento.modo_pantalla_gigante,
        }
        setEvento(prev => prev ? { ...prev, ...refreshed } : prev)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [evento?.id, supabase])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#030712] text-white flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" />
          <Image src="/logoitectrans_v2.png" alt="ITEC" width={32} height={12} className="absolute inset-0 m-auto w-8 h-3 opacity-60" />
        </div>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="h-screen w-screen bg-[#030712] text-white flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertCircle size={44} className="text-rose-500" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight">Evento no disponible</h1>
        <p className="text-xl text-zinc-500">El evento no está activo o no existe.</p>
      </div>
    )
  }

  const eventUrl = `${siteUrl}/eventos/${evento.slug_qr}`
  const semaforoActivo = evento.herramientas_activas?.semaforo ?? false
  const mostrarSemaforo = semaforoActivo && evento.modo_pantalla_gigante !== 'bienvenida'

  const herramientas = evento.herramientas_activas ?? { encuestas: false, preguntas: false, nube: false, semaforo: false }
  const modoEfectivo: ModoPantalla = (
    (evento.modo_pantalla_gigante === 'encuestas' && !herramientas.encuestas) ||
    (evento.modo_pantalla_gigante === 'nube' && !herramientas.nube) ||
    (evento.modo_pantalla_gigante === 'preguntas' && !herramientas.preguntas)
  ) ? 'bienvenida' : evento.modo_pantalla_gigante

  const semaforoConfig = {
    VERDE: { glow: '#10B981', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/40', text: 'text-emerald-400', label: 'Comprensión Fluida', border: 'border-emerald-500/30' },
    AMARILLO: { glow: '#F59E0B', bg: 'bg-amber-500', shadow: 'shadow-amber-500/40', text: 'text-amber-400', label: 'Ritmo Acelerado', border: 'border-amber-500/30' },
    ROJO: { glow: '#EF4444', bg: 'bg-rose-500', shadow: 'shadow-rose-500/40', text: 'text-rose-400', label: 'Repasar Contenido', border: 'border-rose-500/30' },
  }

  return (
    <div className="h-screen w-screen bg-[#030712] text-white flex flex-col relative overflow-hidden select-none">

      {/* === Fondo atmosférico animado === */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
          animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }}
          animate={{ x: [0, -30, 20, 0], y: [0, 30, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[40%] left-[50%] w-[50%] h-[50%] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
          animate={{ x: [0, 40, -30, 0], y: [0, -20, 30, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
      </div>

      {/* === Header === */}
      <header className="relative z-10 px-10 pt-8 flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <Image
            src="/logoitectrans_v2.png"
            alt="ITEC Saladillo"
            width={160}
            height={54}
            className="h-12 w-auto object-contain brightness-110"
            priority
          />
        </motion.div>

        {modoEfectivo === 'bienvenida' ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-base font-bold tracking-wide text-zinc-300">
              <span className="text-emerald-400 font-black">{asistentesCount}</span> Personas Acreditadas
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-right"
          >
            <p className="text-lg font-bold text-zinc-400 tracking-widest uppercase">{evento.nombre_evento}</p>
            <p className="text-xs text-zinc-600 tracking-widest uppercase font-light">ITEC Saladillo</p>
          </motion.div>
        )}
      </header>

      {/* === Overlay cuando el modo está desactivado por herramienta inactiva === */}
      {modoEfectivo !== evento.modo_pantalla_gigante && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl rounded-full px-6 py-2 text-amber-400 text-sm font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-amber-500/5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Herramienta desactivada — modo Bienvenida hasta que el orador la active
          </div>
        </div>
      )}

      {/* === Main Content === */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-12 pb-10">
        <AnimatePresence mode="wait">
          {/* ===== MODO: BIENVENIDA ===== */}
          {modoEfectivo === 'bienvenida' && (
            <motion.div
              key="bienvenida"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-row items-center justify-center gap-16 w-full max-w-6xl mx-auto"
            >
              {/* QR a la izquierda */}
              <motion.div
                className="relative shrink-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <div className="absolute -inset-6 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-[40px] blur-2xl" />
                <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 rounded-[36px] blur-xl" />
                <div className="relative bg-white p-5 rounded-3xl shadow-2xl shadow-indigo-500/20">
                  <QRCode value={eventUrl} size={340} bgColor="#ffffff" fgColor="#000000" level="H" />
                </div>
              </motion.div>

              {/* Texto explicativo a la derecha */}
              <div className="flex flex-col items-start text-left max-w-xl gap-6">
                <div className="space-y-4">
                  <motion.h1
                    className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.1]"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  >
                    Bienvenidos a
                  </motion.h1>
                  <motion.p
                    className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 leading-[1.15]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    {evento.nombre_evento}
                  </motion.p>
                </div>

                <motion.p
                  className="text-xl md:text-2xl text-zinc-400 leading-relaxed font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  Escaneá el código QR con tu celular para acreditarte y participar en vivo
                </motion.p>

                <motion.p
                  className="text-lg text-zinc-600 font-mono tracking-wide bg-white/[0.03] border border-white/5 px-6 py-2 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                >
                  {eventUrl}
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* ===== MODO: ENCUESTAS ===== */}
          {modoEfectivo === 'encuestas' && (
            <motion.div
              key="encuestas"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-5xl mx-auto space-y-10"
            >
              <div className="text-center space-y-4">
                <motion.span
                  className="inline-block text-sm font-black uppercase tracking-[0.2em] text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-4 py-1.5 rounded-full"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Vote size={14} className="inline mr-1.5 -mt-0.5" />
                  Encuesta en Vivo
                </motion.span>
                <motion.h2
                  className="text-4xl md:text-5xl font-black text-white leading-tight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {encuestaActiva?.pregunta}
                </motion.h2>
              </div>

              {encuestaActiva && (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {encuestaActiva.opciones.map((opc, idx) => {
                    const votos = votosEncuesta[opc.id] || 0
                    const pct = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0
                    const colores = [
                      'from-cyan-500 to-blue-600',
                      'from-violet-500 to-purple-600',
                      'from-amber-500 to-orange-600',
                      'from-emerald-500 to-teal-600',
                      'from-pink-500 to-rose-600',
                      'from-indigo-500 to-blue-600',
                    ]
                    return (
                      <motion.div
                        key={opc.id}
                        className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                      >
                        <h3 className="text-2xl md:text-3xl font-bold text-white">{opc.texto_opcion}</h3>
                        <div className="w-full bg-white/5 h-8 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${colores[idx % colores.length]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-300">
                            {pct}%
                          </span>
                          <span className="text-xl text-zinc-500 font-bold">
                            {votos} {votos === 1 ? 'voto' : 'votos'}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}

              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="inline-flex items-center gap-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-full px-6 py-3">
                  <Users size={22} className="text-cyan-400" />
                  <span className="text-xl font-bold text-zinc-300">
                    <span className="text-cyan-400 font-black">{totalVotos}</span> votos registrados
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ===== MODO: NUBE ===== */}
          {modoEfectivo === 'nube' && (
            <motion.div
              key="nube"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl mx-auto space-y-8 text-center"
            >
              <motion.span
                className="inline-block text-sm font-black uppercase tracking-[0.2em] text-violet-400 bg-violet-500/10 border border-violet-500/25 px-4 py-1.5 rounded-full"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Cloud size={14} className="inline mr-1.5 -mt-0.5" />
                Nube de Ideas
              </motion.span>

              {palabrasNube.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center gap-6 py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="relative w-24 h-24">
                    <Cloud size={96} className="text-zinc-800" />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles size={32} className="text-violet-400" />
                    </motion.div>
                  </div>
                  <p className="text-2xl text-zinc-500 font-bold tracking-wide">Esperando palabras de la audiencia...</p>
                  <p className="text-lg text-zinc-600">Escaneá el código QR y participá con una palabra clave</p>
                </motion.div>
              ) : (
                <motion.div
                  className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-10 min-h-[350px] flex flex-wrap items-center justify-center gap-5 relative overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                  {palabrasNube.map((pal, idx) => {
                    const maxQty = palabrasNube[0]?.cantidad || 1
                    const sizeScale = 1.2 + (pal.cantidad / maxQty) * 3
                    const opacityScale = 0.5 + (pal.cantidad / maxQty) * 0.5
                    const color = PALETA_NUBE[idx % PALETA_NUBE.length]
                    return (
                      <motion.span
                        key={idx}
                        className="inline-block uppercase tracking-wide font-black transition-all px-5 py-2.5 rounded-2xl cursor-default"
                        style={{
                          fontSize: `${sizeScale}rem`,
                          opacity: opacityScale,
                          color: color,
                          textShadow: `0 0 30px ${color}33`,
                        }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: opacityScale, scale: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.03 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {pal.palabra}
                      </motion.span>
                    )
                  })}
                </motion.div>
              )}

              {palabrasNube.length > 0 && (
                <motion.p
                  className="text-xl text-zinc-500 font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <span className="text-violet-400 font-black">{palabrasNube.length}</span> conceptos aportados por la audiencia
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ===== MODO: PREGUNTAS ===== */}
          {modoEfectivo === 'preguntas' && (
            <motion.div
              key="preguntas"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-5xl mx-auto space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.span
                  className="inline-block text-sm font-black uppercase tracking-[0.2em] text-purple-400 bg-purple-500/10 border border-purple-500/25 px-4 py-1.5 rounded-full"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <MessageSquare size={14} className="inline mr-1.5 -mt-0.5" />
                  Preguntas
                </motion.span>
                <motion.h2
                  className="text-3xl md:text-4xl font-black text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Preguntas del Auditorio
                </motion.h2>
              </div>

              {preguntas.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center gap-6 py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="relative w-24 h-24">
                    <MessageSquare size={96} className="text-zinc-800" />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles size={32} className="text-purple-400" />
                    </motion.div>
                  </div>
                  <p className="text-2xl text-zinc-500 font-bold tracking-wide">Esperando preguntas de la audiencia...</p>
                  <p className="text-lg text-zinc-600">Las preguntas aprobadas aparecerán aquí en tiempo real</p>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {preguntas.map((q, idx) => (
                    <motion.div
                      key={q.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      className={`relative backdrop-blur-xl border rounded-3xl p-6 ${
                        idx === 0
                          ? 'md:col-span-2 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/25'
                          : 'bg-white/[0.04] border-white/10'
                      }`}
                    >
                      {idx === 0 && (
                        <>
                          <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-transparent rounded-3xl blur-sm pointer-events-none" />
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent rounded-t-3xl" />
                        </>
                      )}

                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                            idx === 0
                              ? 'text-indigo-300 bg-indigo-500/15 border-indigo-500/20'
                              : 'text-zinc-400 bg-white/5 border-white/10'
                          }`}>
                            {q.nombre}
                          </span>
                          {idx === 0 && (
                            <span className="text-xs font-black text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Sparkles size={12} /> Destacada
                            </span>
                          )}
                        </div>

                        <p className={`font-bold text-white leading-snug ${
                          idx === 0 ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
                        }`}>
                          &ldquo;{q.pregunta}&rdquo;
                        </p>

                        <div className={`flex items-center gap-2 mt-4 font-black ${
                          idx === 0 ? 'text-xl' : 'text-base'
                        } text-indigo-400`}>
                          <ThumbsUp size={idx === 0 ? 22 : 18} className="fill-indigo-400" />
                          {q.likes} {q.likes === 1 ? 'voto' : 'votos'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {preguntas.length > 0 && (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="inline-flex items-center gap-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-full px-6 py-3">
                    <MessageSquare size={22} className="text-purple-400" />
                    <span className="text-xl font-bold text-zinc-300">
                      <span className="text-purple-400 font-black">{preguntas.length}</span> preguntas en pantalla
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* === Footer === */}
      <footer className="relative z-10 pb-6 text-center">
        <p className="text-sm text-zinc-700 tracking-[0.3em] uppercase font-light">
          ITEC Saladillo — Innovación · Tecnología · Emprendedurismo · Ciencia
        </p>
      </footer>

      {/* === Widget Semáforo flotante (esquina inferior derecha) === */}
      <AnimatePresence>
        {mostrarSemaforo && estadoSemaforo && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-4 bg-black/70 backdrop-blur-2xl border rounded-2xl px-5 py-3.5 shadow-2xl ${semaforoConfig[estadoSemaforo.estado].border}`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <div
                className={`absolute inset-0 rounded-full animate-ping opacity-40 ${semaforoConfig[estadoSemaforo.estado].bg}`}
              />
              <div
                className={`relative w-5 h-5 rounded-full shadow-lg ${semaforoConfig[estadoSemaforo.estado].bg}`}
                style={{ boxShadow: `0 0 20px ${semaforoConfig[estadoSemaforo.estado].glow}66` }}
              />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-black uppercase tracking-wider ${semaforoConfig[estadoSemaforo.estado].text}`}>
                {semaforoConfig[estadoSemaforo.estado].label}
              </span>
              <span className="text-xs text-zinc-500 font-bold">
                {estadoSemaforo.porcentajeNegativo}% negativo ({estadoSemaforo.votosNegativos}/{estadoSemaforo.totalAcreditados})
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
