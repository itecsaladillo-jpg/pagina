'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Send, Hand, MessageSquare, Check, TrendingUp,
  Settings, X, Sparkles, ArrowLeft, Video, VideoOff,
  Copy, ExternalLink, Vote, AlertTriangle, BarChart3,
  Circle, CheckCircle2, Clock, ThumbsUp, Lightbulb,
  ChevronRight, Eye, Zap, Shield
} from 'lucide-react'
import {
  updateClaseMeetUrlAction,
  crearEncuestaAction,
  toggleEncuestaActivaAction,
  marcarPreguntaResueltaAction,
  atenderManoAlzadaAction,
  bajarManoAlzadaAction,
  reiniciarSemaforoAction,
  votarModometroAction,
  levantarManoAction,
  publicarPreguntaAction,
  toggleVotoPreguntaAction,
  responderEncuestaAction,
  votarSemaforoAction
} from './actions'
import type {
  ClaseVirtual, ClaseModometroVoto, ClaseManoAlzada,
  ClasePregunta, ClaseEncuesta, ClaseEncuestaRespuesta,
  ClaseSemaforoVoto, ModometroEstado, SemaforoColor
} from '@/types/database'

interface MensajeChat {
  id: string
  nombre: string
  email: string
  texto: string
  timestamp: string
  sistema?: boolean
}

export default function ClaseVirtualPage() {
  const { id } = useParams<{ id: string }>()
  const claseId = id as string
  const router = useRouter()
  const supabase = createClient()
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ── ESTADOS GLOBALES ──
  const [clase, setClase] = useState<ClaseVirtual | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'alumno' | 'profesor'>('alumno')
  const [espectadores, setEspectadores] = useState(12)
  const [meetUrlInput, setMeetUrlInput] = useState('')

  // ── ESTADOS ALUMNO ──
  const [alumnoNombre, setAlumnoNombre] = useState('')
  const [alumnoEmail, setAlumnoEmail] = useState('')
  const [isRegistrado, setIsRegistrado] = useState(false)
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)

  // ── CHAT ──
  const [chatMessages, setChatMessages] = useState<MensajeChat[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')

  // ── MODÓMETRO ──
  const [votoActual, setVotoActual] = useState<ModometroEstado | null>(null)
  const [votos, setVotos] = useState<ClaseModometroVoto[]>([])

  // ── MANO ALZADA ──
  const [manosAlzadas, setManosAlzadas] = useState<ClaseManoAlzada[]>([])
  const [miManoId, setMiManoId] = useState<string | null>(null)

  // ── PREGUNTAS ──
  const [preguntas, setPreguntas] = useState<ClasePregunta[]>([])
  const [nuevaPregunta, setNuevaPregunta] = useState('')
  const [votosPregunta, setVotosPregunta] = useState<Set<string>>(new Set())

  // ── ENCUESTAS ──
  const [encuestaActiva, setEncuestaActiva] = useState<ClaseEncuesta | null>(null)
  const [encuestaVotoIdx, setEncuestaVotoIdx] = useState<number | null>(null)
  const [respuestasEncuesta, setRespuestasEncuesta] = useState<ClaseEncuestaRespuesta[]>([])
  const [encuestasClase, setEncuestasClase] = useState<ClaseEncuesta[]>([])

  // ── SEMÁFORO ──
  const [semaforoVoto, setSemaforoVoto] = useState<SemaforoColor | null>(null)
  const [semaforoVotos, setSemaforoVotos] = useState<ClaseSemaforoVoto[]>([])

  // ── DOCENTE: NUEVA ENCUESTA ──
  const [nuevaEncuestaPregunta, setNuevaEncuestaPregunta] = useState('')
  const [nuevaEncuestaOpciones, setNuevaEncuestaOpciones] = useState(['', ''])

  // ── PESTAÑA ALUMNO ──
  const [tabActiva, setTabActiva] = useState<'modometro' | 'mano' | 'qa' | 'encuestas' | 'semaforo'>('modometro')

  // ── UTILIDADES ──
  const miMemberId = useMemo(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('itec_member_id') || null
  }, [isRegistrado])

  // ─────────────────────────────────────────────
  // CARGA INICIAL
  // ─────────────────────────────────────────────
  useEffect(() => {
    const savedNombre = localStorage.getItem('itec_alumno_nombre')
    const savedEmail = localStorage.getItem('itec_alumno_email')
    if (savedNombre && savedEmail) {
      setAlumnoNombre(savedNombre)
      setAlumnoEmail(savedEmail)
      setIsRegistrado(true)
    } else {
      setRegistrationModalOpen(true)
    }

    async function loadClase() {
      try {
        const { data, error } = await supabase
          .from('clases_virtuales')
          .select('*')
          .eq('id', claseId)
          .single()

        if (error || !data) {
          const demoClase = {
            id: claseId,
            titulo: 'Capacitación Híbrida ITEC — Google Meet + Consola Interactiva',
            url_stream: '',
            estado_sidebar: 'chat' as const,
            modalidad: 'virtual' as const,
            meet_url: null,
            en_vivo: false,
            created_at: new Date().toISOString()
          }
          await supabase.from('clases_virtuales').upsert(demoClase)
          setClase(demoClase)
          setMeetUrlInput('')
        } else {
          setClase(data as ClaseVirtual)
          setMeetUrlInput((data as ClaseVirtual).meet_url || '')
        }
      } catch (err) {
        console.error('Error cargando la clase:', err)
      } finally {
        setLoading(false)
      }
    }
    loadClase()

    const interval = setInterval(() => {
      setEspectadores(prev => {
        const diff = Math.floor(Math.random() * 5) - 2
        return Math.max(5, prev + diff)
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [claseId, supabase])

  // ─────────────────────────────────────────────
  // SUSCRIPCIONES REALTIME
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!clase) return

    // Canal: cambios en la clase (Meet URL, modalidad)
    const claseChannel = supabase
      .channel(`clase-${claseId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'clases_virtuales',
        filter: `id=eq.${claseId}`
      }, (payload) => {
        const nueva = payload.new as ClaseVirtual
        setClase(nueva)
        setMeetUrlInput(nueva.meet_url || '')
      })
      .subscribe()

    // Canal: modómetro
    const modometroChannel = supabase
      .channel(`modometro-${claseId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'clase_modometro_votos',
        filter: `clase_id=eq.${claseId}`
      }, () => fetchVotos())
      .subscribe()

    // Canal: mano alzada
    const manoChannel = supabase
      .channel(`mano-${claseId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'clase_mano_alzada',
        filter: `clase_id=eq.${claseId}`
      }, () => fetchManos())
      .subscribe()

    // Canal: preguntas
    const preguntasChannel = supabase
      .channel(`preguntas-${claseId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'clase_preguntas',
        filter: `clase_id=eq.${claseId}`
      }, () => fetchPreguntas())
      .subscribe()

    // Canal: encuestas
    const encuestasChannel = supabase
      .channel(`encuestas-${claseId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'clase_encuestas',
        filter: `clase_id=eq.${claseId}`
      }, () => fetchEncuestas())
      .subscribe()

    // Canal: semáforo
    const semaforoChannel = supabase
      .channel(`semaforo-${claseId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'clase_semaforo_votos',
        filter: `clase_id=eq.${claseId}`
      }, () => fetchSemaforo())
      .subscribe()

    // Canal: chat broadcast
    const chatChannel = supabase.channel(`chat-broadcast-${claseId}`, {
      config: { broadcast: { self: false } }
    })
    chatChannel
      .on('broadcast', { event: 'msg' }, (payload) => {
        setChatMessages(prev => [...prev, payload.payload as MensajeChat])
      })
      .subscribe()

    // Carga inicial
    fetchVotos()
    fetchManos()
    fetchPreguntas()
    fetchEncuestas()
    fetchSemaforo()

    return () => {
      supabase.removeChannel(claseChannel)
      supabase.removeChannel(modometroChannel)
      supabase.removeChannel(manoChannel)
      supabase.removeChannel(preguntasChannel)
      supabase.removeChannel(encuestasChannel)
      supabase.removeChannel(semaforoChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [clase, claseId, supabase])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ─────────────────────────────────────────────
  // FETCHERS
  // ─────────────────────────────────────────────
  async function fetchVotos() {
    const { data } = await supabase
      .from('clase_modometro_votos')
      .select('*')
      .eq('clase_id', claseId)
    if (data) {
      setVotos(data as ClaseModometroVoto[])
      if (alumnoEmail) {
        const miVoto = data.find(v => v.nombre_completo === alumnoNombre || v.member_id === miMemberId)
        if (miVoto) setVotoActual(miVoto.estado)
      }
    }
  }

  async function fetchManos() {
    const { data } = await supabase
      .from('clase_mano_alzada')
      .select('*')
      .eq('clase_id', claseId)
      .order('created_at', { ascending: true })
    if (data) {
      setManosAlzadas(data as ClaseManoAlzada[])
      if (alumnoNombre) {
        const miMano = data.find(m => m.nombre_completo === alumnoNombre && m.estado === 'esperando')
        setMiManoId(miMano?.id || null)
      }
    }
  }

  async function fetchPreguntas() {
    const { data } = await supabase
      .from('clase_preguntas')
      .select('*')
      .eq('clase_id', claseId)
      .order('votos_count', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setPreguntas(data as ClasePregunta[])
  }

  async function fetchEncuestas() {
    const { data } = await supabase
      .from('clase_encuestas')
      .select('*')
      .eq('clase_id', claseId)
      .order('created_at', { ascending: false })
    if (data) {
      const encs = data as ClaseEncuesta[]
      setEncuestasClase(encs)
      const activa = encs.find(e => e.activa)
      setEncuestaActiva(activa || null)
      if (activa) {
        setEncuestaVotoIdx(null)
        const { data: misRespuestas } = await supabase
          .from('clase_encuesta_respuestas')
          .select('*')
          .eq('encuesta_id', activa.id)
        if (misRespuestas) {
          setRespuestasEncuesta(misRespuestas as ClaseEncuestaRespuesta[])
          const miResp = (misRespuestas as ClaseEncuestaRespuesta[]).find(
            r => r.member_id === miMemberId || r.nombre_completo === alumnoNombre
          )
          if (miResp) setEncuestaVotoIdx(miResp.opcion_index)
        }
      }
    }
  }

  async function fetchSemaforo() {
    const { data } = await supabase
      .from('clase_semaforo_votos')
      .select('*')
      .eq('clase_id', claseId)
    if (data) {
      setSemaforoVotos(data as ClaseSemaforoVoto[])
      if (alumnoNombre) {
        const miVoto = data.find(v => v.nombre_completo === alumnoNombre || v.member_id === miMemberId)
        if (miVoto) setSemaforoVoto(miVoto.color)
      }
    }
  }

  // ─────────────────────────────────────────────
  // MÉTRICAS COMPUTADAS
  // ─────────────────────────────────────────────
  const totalVotosModometro = votos.length
  const votosBien = votos.filter(v => v.estado === 'voy_bien').length
  const votosPerdido = votos.filter(v => v.estado === 'me_perdi').length
  const votosRapido = votos.filter(v => v.estado === 'muy_rapido').length
  const pctBien = totalVotosModometro > 0 ? Math.round((votosBien / totalVotosModometro) * 100) : 0
  const pctPerdido = totalVotosModometro > 0 ? Math.round((votosPerdido / totalVotosModometro) * 100) : 0
  const pctRapido = totalVotosModometro > 0 ? Math.round((votosRapido / totalVotosModometro) * 100) : 0
  const alertaPerdida = pctPerdido + pctRapido > 30

  const manosEsperando = manosAlzadas.filter(m => m.estado === 'esperando')
  const preguntasSinResolver = preguntas.filter(p => !p.resuelta)
  const totalVotosSemaforo = semaforoVotos.length
  const semV = semaforoVotos.filter(v => v.color === 'verde').length
  const semA = semaforoVotos.filter(v => v.color === 'amarillo').length
  const semR = semaforoVotos.filter(v => v.color === 'rojo').length

  const respuestasPorOpcion = useMemo(() => {
    if (!encuestaActiva) return []
    return encuestaActiva.opciones.map((_, idx) =>
      respuestasEncuesta.filter(r => r.opcion_index === idx).length
    )
  }, [encuestaActiva, respuestasEncuesta])
  const totalRespEncuesta = respuestasEncuesta.length

  // ─────────────────────────────────────────────
  // ACCIONES
  // ─────────────────────────────────────────────
  function handleRegistrar(e: React.FormEvent) {
    e.preventDefault()
    if (!alumnoNombre.trim() || !alumnoEmail.trim()) return
    localStorage.setItem('itec_alumno_nombre', alumnoNombre.trim())
    localStorage.setItem('itec_alumno_email', alumnoEmail.trim())
    setIsRegistrado(true)
    setRegistrationModalOpen(false)
  }

  function handleResetPerfil() {
    localStorage.removeItem('itec_alumno_nombre')
    localStorage.removeItem('itec_alumno_email')
    localStorage.removeItem('itec_member_id')
    setAlumnoNombre('')
    setAlumnoEmail('')
    setIsRegistrado(false)
    setRegistrationModalOpen(true)
  }

  function enviarMensajeChat() {
    if (!isRegistrado || !nuevoMensaje.trim()) return
    const msg: MensajeChat = {
      id: Math.random().toString(),
      nombre: alumnoNombre,
      email: alumnoEmail,
      texto: nuevoMensaje.trim(),
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }
    supabase.channel(`chat-broadcast-${claseId}`).send({
      type: 'broadcast', event: 'msg', payload: msg
    })
    setChatMessages(prev => [...prev, msg])
    setNuevoMensaje('')
  }

  function enviarMensajeSistema(texto: string) {
    const msg: MensajeChat = {
      id: Math.random().toString(),
      nombre: 'Sistema', email: 'sistema@itec.edu.ar',
      texto, timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      sistema: true
    }
    supabase.channel(`chat-broadcast-${claseId}`).send({
      type: 'broadcast', event: 'msg', payload: msg
    })
    setChatMessages(prev => [...prev, msg])
  }

  async function handleVotarModometro(estado: ModometroEstado) {
    if (!isRegistrado) { setRegistrationModalOpen(true); return }
    setVotoActual(estado)
    await votarModometroAction(claseId, miMemberId, alumnoNombre, estado)
  }

  async function handleLevantarMano() {
    if (!isRegistrado) { setRegistrationModalOpen(true); return }
    const result = await levantarManoAction(claseId, miMemberId, alumnoNombre)
    if (result.success && result.data === 'levantada') {
      enviarMensajeSistema(`${alumnoNombre} levantó la mano`)
    }
    fetchManos()
  }

  async function handleVotarPregunta(preguntaId: string) {
    if (!isRegistrado) { setRegistrationModalOpen(true); return }
    const memberId = miMemberId || alumnoEmail
    await toggleVotoPreguntaAction(preguntaId, memberId, alumnoNombre)
    fetchPreguntas()
  }

  async function handlePublicarPregunta() {
    if (!isRegistrado) { setRegistrationModalOpen(true); return }
    if (!nuevaPregunta.trim()) return
    await publicarPreguntaAction(claseId, miMemberId, alumnoNombre, nuevaPregunta.trim())
    setNuevaPregunta('')
    fetchPreguntas()
    enviarMensajeSistema(`${alumnoNombre} publicó una pregunta`)
  }

  async function handleVotarEncuesta(idx: number) {
    if (!isRegistrado) { setRegistrationModalOpen(true); return }
    if (!encuestaActiva) return
    const memberId = miMemberId || alumnoEmail
    await responderEncuestaAction(encuestaActiva.id, memberId, alumnoNombre, idx)
    setEncuestaVotoIdx(idx)
    fetchEncuestas()
  }

  async function handleVotarSemaforo(color: SemaforoColor) {
    if (!isRegistrado) { setRegistrationModalOpen(true); return }
    setSemaforoVoto(color)
    await votarSemaforoAction(claseId, miMemberId, alumnoNombre, color)
  }

  // ── ACCIONES DOCENTE ──
  async function handleDocenteGuardarMeetUrl() {
    await updateClaseMeetUrlAction(claseId, meetUrlInput.trim())
    enviarMensajeSistema('El docente actualizó el enlace de Google Meet')
  }

  async function handleDocenteAtenderMano(manoId: string) {
    await atenderManoAlzadaAction(manoId)
    fetchManos()
  }

  async function handleDocenteBajarMano(manoId: string) {
    await bajarManoAlzadaAction(manoId)
    fetchManos()
  }

  async function handleDocenteResolverPregunta(preguntaId: string) {
    await marcarPreguntaResueltaAction(preguntaId, true)
    fetchPreguntas()
  }

  async function handleDocenteCrearEncuesta() {
    if (!nuevaEncuestaPregunta.trim()) return
    const opcionesFiltradas = nuevaEncuestaOpciones.filter(o => o.trim())
    if (opcionesFiltradas.length < 2) return
    await crearEncuestaAction(claseId, nuevaEncuestaPregunta.trim(), opcionesFiltradas)
    setNuevaEncuestaPregunta('')
    setNuevaEncuestaOpciones(['', ''])
    fetchEncuestas()
    enviarMensajeSistema('📊 ¡Nueva encuesta lanzada!')
  }

  async function handleDocenteToggleEncuesta(encuestaId: string, activa: boolean) {
    await toggleEncuestaActivaAction(encuestaId, activa)
    fetchEncuestas()
  }

  async function handleDocenteReiniciarSemaforo() {
    await reiniciarSemaforoAction(claseId)
    setSemaforoVoto(null)
    fetchSemaforo()
    enviarMensajeSistema('🚦 El semáforo de comprensión fue reiniciado')
  }

  function copiarAlPortapapeles(texto: string) {
    navigator.clipboard.writeText(texto)
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center font-sans text-slate-100">
        <div className="w-12 h-12 rounded-full border-t-2 border-emerald-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-semibold">Sincronizando con el Aula Virtual de ITEC...</p>
      </div>
    )
  }

  const TABS_ALUMNO = [
    { key: 'modometro', label: 'Modómetro', icon: TrendingUp },
    { key: 'mano', label: 'Mano', icon: Hand },
    { key: 'qa', label: 'Q&A', icon: MessageSquare },
    { key: 'encuestas', label: 'Encuestas', icon: Vote },
    { key: 'semaforo', label: 'Semáforo', icon: Circle },
  ] as const

  return (
    <div className="min-h-screen bg-[#06080e] flex flex-col font-sans text-slate-100 relative overflow-hidden">

      {/* ── BARRA SUPERIOR ── */}
      <div className="bg-[#0b0e17]/95 border-b border-slate-800/80 px-4 py-2 flex flex-wrap justify-between items-center z-50 text-xs shadow-md backdrop-blur-md relative gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-900/50 hover:bg-slate-800 py-1 px-2.5 rounded-lg border border-slate-800 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-bold">Volver</span>
          </button>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px] hidden sm:inline shrink-0">
            Aula Híbrida
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Simular Rol:</span>
          <button onClick={() => setUserRole('alumno')}
            className={`py-1.5 px-3 rounded-lg font-semibold tracking-wide transition-all duration-200 ${userRole === 'alumno' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-slate-300'}`}>
            Alumno
          </button>
          <button onClick={() => setUserRole('profesor')}
            className={`py-1.5 px-3 rounded-lg font-semibold tracking-wide transition-all duration-200 ${userRole === 'profesor' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-slate-300'}`}>
            Docente
          </button>
          {isRegistrado && userRole === 'alumno' && (
            <>
              <span className="text-slate-700">|</span>
              <button onClick={handleResetPerfil}
                className="text-slate-400 hover:text-slate-300 underline font-medium">
                Perfil: {alumnoNombre.split(' ')[0]}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Glow decorativo */}
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-950/5 blur-[120px] pointer-events-none" />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-45px)]">

        {/* ─── COLUMNA IZQUIERDA: GOOGLE MEET + CONTENIDO ─── */}
        <div className="flex-1 flex flex-col p-4 md:p-6 justify-start gap-4 overflow-y-auto">

          {/* BANNER GOOGLE MEET */}
          <div className="w-full max-w-4xl mx-auto space-y-3">
            {clase?.modalidad === 'virtual' && clase?.meet_url ? (
              <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Video className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">En vivo</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 mt-0.5">Videollamada Google Meet</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={clase.meet_url} target="_blank" rel="noopener noreferrer"
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-emerald-600/20">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ingresar a Meet
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <VideoOff className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {clase?.modalidad === 'virtual' ? 'En espera del docente' : 'Modo Presencial'}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {clase?.modalidad === 'virtual'
                      ? 'El docente aún no compartió el enlace de Google Meet.'
                      : 'Esta clase se realiza de forma presencial.'}
                  </p>
                </div>
              </div>
            )}

            {/* MÓDULO DE AYUDA RÁPIDA */}
            {isRegistrado && userRole === 'alumno' && (
              <div className="bg-[#0d121c]/45 border border-slate-900 rounded-2xl p-3 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-400">Tu nombre:</span>
                  <span className="font-bold text-slate-200">{alumnoNombre}</span>
                  <button onClick={() => copiarAlPortapapeles(alumnoNombre)}
                    className="text-slate-500 hover:text-slate-300 transition-colors" title="Copiar nombre">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-slate-700 hidden sm:inline">|</span>
                <p className="text-[10px] text-slate-500 italic">
                  Tip: Mantén ITEC abierto junto a Google Meet para usar el Modómetro, levantar la mano y responder preguntas.
                </p>
              </div>
            )}
          </div>

          {/* ─── CONTENIDO PRINCIPAL: VISTA SEGÚN ROL ─── */}
          {userRole === 'profesor' ? (
            /* ═══════════════════════════════════════════════════════
               CONSOLA DEL DOCENTE / MODERADOR
               ═══════════════════════════════════════════════════════ */
            <div className="w-full max-w-4xl mx-auto space-y-4 pb-6">
              {/* Control de Enlace Meet */}
              <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Control de Enlace Google Meet</h4>
                </div>
                <p className="text-[10px] text-slate-500">Actualizá la URL sin que los alumnos deban refrescar la página.</p>
                <div className="flex gap-2">
                  <input type="url" value={meetUrlInput}
                    onChange={(e) => setMeetUrlInput(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  <button onClick={handleDocenteGuardarMeetUrl}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all duration-200">
                    Guardar
                  </button>
                </div>
                {clase?.meet_url && (
                  <a href={clase.meet_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold">
                    <ExternalLink className="w-3 h-3" /> Abrir Meet actual
                  </a>
                )}
              </div>

              {/* ALERTA MODÓMETRO */}
              {alertaPerdida && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-950/50 border border-rose-500/30 rounded-2xl p-3 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <p className="text-xs text-rose-300 font-bold">
                    ⚠️ Alerta: {pctPerdido + pctRapido}% de alumnos reportan dificultad. Considerá revisar el contenido.
                  </p>
                </motion.div>
              )}

              {/* TABLERO MODÓMETRO EN VIVO */}
              <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Modómetro en Vivo</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">{totalVotosModometro} votos</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Voy bien', emoji: '👍', pct: pctBien, count: votosBien, color: 'emerald' },
                    { label: 'Me perdí', emoji: '😵', pct: pctPerdido, count: votosPerdido, color: 'amber' },
                    { label: 'Muy rápido', emoji: '⚡', pct: pctRapido, count: votosRapido, color: 'cyan' },
                  ].map(item => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{item.emoji} {item.label} <span className="text-slate-500 font-normal">({item.count})</span></span>
                        <span className={`text-${item.color}-400 font-bold`}>{item.pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden relative">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.5 }}
                          className={`absolute inset-y-0 left-0 bg-${item.color}-500 rounded-full`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLA DE MANO ALZADA */}
              <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Hand className="w-4 h-4 text-rose-500" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Cola de Mano Alzada ({manosEsperando.length})</h4>
                  </div>
                </div>
                {manosEsperando.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 border border-dashed border-slate-900 rounded-xl">
                    <p className="text-[10px] font-bold">Sin pedidos de palabra</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">La participación está libre.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {manosEsperando.map((mano, idx) => (
                      <motion.div key={mano.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-950/75 border border-slate-900 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold shrink-0">#{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-200 truncate">{mano.nombre_completo}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handleDocenteAtenderMano(mano.id)}
                            className="py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-[10px] font-bold border border-emerald-500/20 transition-all duration-200">
                            Dar Palabra
                          </button>
                          <button onClick={() => handleDocenteBajarMano(mano.id)}
                            className="py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-[10px] font-bold border border-slate-900 transition-all duration-200">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* GESTOR DE PREGUNTAS */}
              <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Preguntas ({preguntasSinResolver.length} sin resolver)</h4>
                </div>
                {preguntas.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 border border-dashed border-slate-900 rounded-xl">
                    <p className="text-[10px] font-bold">Sin preguntas aún</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {preguntas.map((preg) => (
                      <motion.div key={preg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`bg-slate-950/75 border rounded-xl p-3 space-y-2 ${preg.resuelta ? 'border-emerald-500/20 opacity-60' : 'border-slate-900'}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-200">{preg.nombre_completo}</p>
                            <p className="text-[11px] text-slate-300 mt-1">{preg.pregunta}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <ThumbsUp className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-400">{preg.votos_count}</span>
                          </div>
                        </div>
                        {!preg.resuelta && (
                          <div className="flex justify-end">
                            <button onClick={() => handleDocenteResolverPregunta(preg.id)}
                              className="py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-[10px] font-bold border border-emerald-500/20 transition-all duration-200">
                              Marcar Resuelta ✓
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* LANZADOR DE ENCUESTAS */}
              <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Vote className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Lanzar Encuesta</h4>
                </div>
                <div className="space-y-2">
                  <input type="text" value={nuevaEncuestaPregunta}
                    onChange={(e) => setNuevaEncuestaPregunta(e.target.value)}
                    placeholder="Pregunta de la encuesta..."
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors" />
                  {nuevaEncuestaOpciones.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" value={opt}
                        onChange={(e) => {
                          const copy = [...nuevaEncuestaOpciones]
                          copy[idx] = e.target.value
                          setNuevaEncuestaOpciones(copy)
                        }}
                        placeholder={`Opción ${idx + 1}...`}
                        className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors" />
                      {nuevaEncuestaOpciones.length > 2 && (
                        <button onClick={() => setNuevaEncuestaOpciones(nuevaEncuestaOpciones.filter((_, i) => i !== idx))}
                          className="text-slate-600 hover:text-slate-400 p-2">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => setNuevaEncuestaOpciones([...nuevaEncuestaOpciones, ''])}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-bold">
                      + Agregar opción
                    </button>
                    <div className="flex-1" />
                    <button onClick={handleDocenteCrearEncuesta}
                      className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all duration-200">
                      Lanzar Encuesta
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTROL DEL SEMÁFORO */}
              <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Circle className="w-4 h-4 text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Semáforo de Comprensión</h4>
                  </div>
                  <button onClick={handleDocenteReiniciarSemaforo}
                    className="text-[9px] bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-300 py-1 px-2 rounded-lg font-bold transition-all duration-200">
                    Reiniciar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { color: 'verde', label: 'Entendido', count: semV, bg: 'emerald' },
                    { color: 'amarillo', label: 'Duda', count: semA, bg: 'amber' },
                    { color: 'rojo', label: 'No entendí', count: semR, bg: 'rose' },
                  ].map(item => (
                    <div key={item.color} className={`bg-${item.bg}-950/30 border border-${item.bg}-500/20 rounded-xl p-3 text-center space-y-1`}>
                      <div className={`text-lg font-bold text-${item.bg}-400`}>{item.count}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</div>
                    </div>
                  ))}
                </div>
                {totalVotosSemaforo > 0 && (
                  <div className="text-[10px] text-slate-500 text-center">
                    {totalVotosSemaforo} participantes votaron
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════
               VISTA DEL ALUMNO / PARTICIPANTE
               ═══════════════════════════════════════════════════════ */
            <div className="w-full max-w-4xl mx-auto pb-6">
              {/* Pestañas de herramientas */}
              <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                {TABS_ALUMNO.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button key={tab.key} onClick={() => setTabActiva(tab.key)}
                      className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-[11px] font-bold transition-all duration-200 shrink-0 ${tabActiva === tab.key
                        ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-950/40 border border-slate-900 text-slate-500 hover:text-slate-400'}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* CONTENIDO DE PESTAÑAS */}
              <AnimatePresence mode="wait">
                {/* ── MODÓMETRO ── */}
                {tabActiva === 'modometro' && (
                  <motion.div key="modometro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-6 space-y-5">
                    <div className="text-center space-y-1">
                      <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 mb-2 animate-pulse">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Modómetro de Comprensión</h4>
                      <p className="text-xs text-slate-400">Contale al docente cómo venís siguiendo.</p>
                    </div>
                    <div className="w-full space-y-3 max-w-[320px] mx-auto">
                      {[
                        { estado: 'voy_bien' as ModometroEstado, emoji: '👍', label: 'Voy bien', color: 'emerald' },
                        { estado: 'me_perdi' as ModometroEstado, emoji: '😵', label: 'Me perdí', color: 'amber' },
                        { estado: 'muy_rapido' as ModometroEstado, emoji: '⚡', label: 'Muy rápido', color: 'cyan' },
                      ].map(opt => (
                        <motion.button key={opt.estado} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleVotarModometro(opt.estado)}
                          className={`w-full py-4 px-5 rounded-2xl text-left border flex justify-between items-center transition-all duration-300 ${votoActual === opt.estado
                            ? `bg-${opt.color}-950/60 border-${opt.color}-500/50 text-white shadow-[0_0_20px_rgba(var(--glow),0.15)]`
                            : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{opt.emoji}</span>
                            <span className="text-xs font-bold tracking-wide">{opt.label}</span>
                          </div>
                          {votoActual === opt.estado && <Check className={`w-4 h-4 text-${opt.color}-400 stroke-[3]`} />}
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 italic text-center">Podés cambiar tu voto en cualquier momento.</p>
                  </motion.div>
                )}

                {/* ── MANO ALZADA ── */}
                {tabActiva === 'mano' && (
                  <motion.div key="mano" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-6 space-y-5">
                    <div className="text-center space-y-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${miManoId ? 'bg-rose-950/60 border border-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-950 border border-slate-900 text-slate-500'}`}>
                        <Hand className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Mano Alzada</h4>
                      <p className="text-xs text-slate-400">Levantá tu mano para pedir la palabra.</p>
                    </div>
                    <div className="flex justify-center">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={handleLevantarMano}
                        className={`py-4 px-8 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all duration-300 ${miManoId
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'}`}>
                        <Hand className="w-5 h-5" />
                        {miManoId ? 'Bajar Mano' : 'Levantar Mano'}
                      </motion.button>
                    </div>
                    {miManoId && (
                      <div className="text-center text-xs text-slate-400">
                        Tu posición en la cola: <strong className="text-slate-200">#{manosEsperando.findIndex(m => m.id === miManoId) + 1}</strong>
                      </div>
                    )}
                    {manosEsperando.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-900">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cola actual:</p>
                        {manosEsperando.map((m, idx) => (
                          <div key={m.id} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-600">#{idx + 1}</span>
                            <span className={`font-medium ${m.nombre_completo === alumnoNombre ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {m.nombre_completo}{m.nombre_completo === alumnoNombre ? ' (vos)' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Q&A ── */}
                {tabActiva === 'qa' && (
                  <motion.div key="qa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Preguntas de la Comunidad</h4>
                    </div>
                    {/* Input nueva pregunta */}
                    <div className="flex gap-2">
                      <input type="text" value={nuevaPregunta}
                        onChange={(e) => setNuevaPregunta(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePublicarPregunta()}
                        placeholder="Escribí tu pregunta..."
                        className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors" />
                      <button onClick={handlePublicarPregunta}
                        disabled={!nuevaPregunta.trim()}
                        className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center hover:bg-amber-500 transition-colors disabled:opacity-50">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Lista de preguntas */}
                    {preguntas.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 border border-dashed border-slate-900 rounded-xl">
                        <p className="text-[10px] font-bold">Sé el primero en preguntar</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {preguntas.map((preg) => (
                          <motion.div key={preg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className={`bg-slate-950/75 border rounded-xl p-3 space-y-2 ${preg.resuelta ? 'border-emerald-500/20' : 'border-slate-900'}`}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-400">{preg.nombre_completo}</p>
                                <p className="text-xs text-slate-200 mt-1">{preg.pregunta}</p>
                              </div>
                              <button onClick={() => handleVotarPregunta(preg.id)}
                                className="flex items-center gap-1 shrink-0 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-all duration-200">
                                <ThumbsUp className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{preg.votos_count}</span>
                              </button>
                            </div>
                            {preg.resuelta && (
                              <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Resuelta
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── ENCUESTAS ── */}
                {tabActiva === 'encuestas' && (
                  <motion.div key="encuestas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-1.5">
                      <Vote className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Encuesta en Vivo</h4>
                    </div>
                    {!encuestaActiva ? (
                      <div className="text-center py-8 text-slate-500 border border-dashed border-slate-900 rounded-xl">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                        <p className="text-[10px] font-bold">Esperando encuesta del docente...</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">Aparecerá automáticamente cuando se lance.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 space-y-3">
                          <p className="text-sm font-bold text-slate-100">{encuestaActiva.pregunta}</p>
                          {encuestaActiva.opciones.map((opt, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <button onClick={() => handleVotarEncuesta(idx)}
                                disabled={encuestaVotoIdx !== null}
                                className={`w-full py-3 px-4 rounded-xl text-left border text-xs font-bold flex items-center justify-between transition-all duration-200 ${encuestaVotoIdx === idx
                                  ? 'bg-cyan-950/60 border-cyan-500/50 text-white'
                                  : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'}`}>
                                <span>{opt}</span>
                                {encuestaVotoIdx !== null && (
                                  <span className="text-cyan-400">{respuestasPorOpcion[idx] || 0}</span>
                                )}
                              </button>
                              {encuestaVotoIdx !== null && (
                                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                                    style={{ width: `${totalRespEncuesta > 0 ? (respuestasPorOpcion[idx] / totalRespEncuesta) * 100 : 0}%` }} />
                                </div>
                              )}
                            </div>
                          ))}
                          {encuestaVotoIdx !== null && (
                            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                              {totalRespEncuesta} respuesta{totalRespEncuesta !== 1 ? 's' : ''} total{totalRespEncuesta !== 1 ? 'es' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── SEMÁFORO ── */}
                {tabActiva === 'semaforo' && (
                  <motion.div key="semaforo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-6 space-y-5">
                    <div className="text-center space-y-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${semaforoVoto === 'verde' ? 'bg-emerald-500 text-white' : semaforoVoto === 'amarillo' ? 'bg-amber-500 text-slate-950' : semaforoVoto === 'rojo' ? 'bg-rose-500 text-white' : 'bg-slate-950 border border-slate-900 text-slate-500'}`}>
                        <Circle className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Semáforo de Comprensión</h4>
                      <p className="text-xs text-slate-400">¿Qué tan claro te quedó el tema?</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 max-w-[360px] mx-auto">
                      {[
                        { color: 'verde' as SemaforoColor, label: 'Entendido', emoji: '🟢', bg: 'emerald' },
                        { color: 'amarillo' as SemaforoColor, label: 'Duda', emoji: '🟡', bg: 'amber' },
                        { color: 'rojo' as SemaforoColor, label: 'No entendí', emoji: '🔴', bg: 'rose' },
                      ].map(opt => (
                        <motion.button key={opt.color} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleVotarSemaforo(opt.color)}
                          className={`py-4 px-3 rounded-2xl border text-center transition-all duration-300 ${semaforoVoto === opt.color
                            ? `bg-${opt.bg}-950/60 border-${opt.bg}-500/50 shadow-[0_0_15px_rgba(var(--glow),0.15)]`
                            : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'}`}>
                          <span className="text-2xl block mb-1">{opt.emoji}</span>
                          <span className="text-[10px] font-bold">{opt.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 italic text-center">Podés cambiar tu respuesta cuando quieras.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ─── COLUMNA DERECHA: CHAT ─── */}
        <div className="w-full lg:w-96 bg-[#0b0e14] border-t lg:border-t-0 lg:border-l border-slate-900 flex flex-col h-full overflow-hidden">
          <div className="px-4 py-3 bg-[#0d121c] border-b border-slate-950 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Chat de la Clase</h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {userRole === 'alumno' ? 'Vista Alumno' : 'Consola Docente'}
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              En Línea
            </span>
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sistema ? 'items-center my-2' : ''}`}>
                {msg.sistema ? (
                  <div className="bg-[#121927] border border-emerald-500/10 px-3 py-1.5 rounded-xl text-center max-w-[90%] flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-slate-400 leading-normal font-medium italic">{msg.texto}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200">{msg.nombre}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                    </div>
                    <div className="bg-[#0d121c]/75 border border-slate-900 p-2.5 rounded-2xl rounded-tl-none text-xs text-slate-300 leading-relaxed max-w-[90%] break-words shadow-inner">
                      {msg.texto}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input chat */}
          <div className="p-3 bg-[#0d121c] border-t border-slate-950 flex gap-2 shrink-0">
            <input type="text" value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarMensajeChat()}
              placeholder={isRegistrado ? "Escribí tu mensaje..." : "Registrate para interactuar"}
              disabled={!isRegistrado}
              className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors" />
            <button onClick={enviarMensajeChat}
              disabled={!isRegistrado || !nuevoMensaje.trim()}
              className="w-8 h-8 rounded-xl bg-emerald-600 text-slate-950 flex items-center justify-center hover:bg-emerald-500 transition-colors disabled:opacity-50">
              <Send className="w-3.5 h-3.5 fill-slate-950" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL REGISTRO ── */}
      <AnimatePresence>
        {registrationModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-w-md w-full bg-[#0d121c] border border-slate-800 rounded-3xl p-6 md:p-8 relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 to-amber-500" />
              <button onClick={() => router.back()}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors z-10 bg-slate-900/50 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-800" title="Volver">
                <X className="w-5 h-5" />
              </button>
              <div className="text-center space-y-2 mb-6 mt-2">
                <div className="flex justify-center mb-4 mt-2">
                  <Image src="/logoitectrans_v2.png" alt="ITEC Saladillo" width={180} height={68}
                    className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" priority />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Ingreso al Aula Virtual</h3>
                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  Ingresá tus credenciales de ITEC para sincronizar tus aportes y herramientas interactivas en tiempo real.
                </p>
              </div>
              <form onSubmit={handleRegistrar} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nombre Completo</label>
                  <input type="text" required value={alumnoNombre} onChange={(e) => setAlumnoNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-800 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Correo Electrónico</label>
                  <input type="email" required value={alumnoEmail} onChange={(e) => setAlumnoEmail(e.target.value)}
                    placeholder="Ej. juan.perez@itec.edu.ar"
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-800 transition-colors" />
                </div>
                <div className="pt-2">
                  <button type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all duration-200 shadow-md hover:shadow-emerald-600/10">
                    Ingresar al Aula en Vivo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
