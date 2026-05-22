'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  createClient 
} from '@/lib/supabase/client'
import { 
  Tv, 
  Users, 
  Send, 
  Hand, 
  HelpCircle, 
  MessageSquare, 
  Check, 
  TrendingUp, 
  Settings, 
  User as UserIcon, 
  Play, 
  Volume2, 
  Maximize2, 
  X,
  VolumeX,
  Sparkles,
  Info
} from 'lucide-react'

// Interfaces de la aplicación
interface ClaseVirtual {
  id: string
  titulo: string
  url_stream: string
  estado_sidebar: 'chat' | 'modometro'
}

interface AlumnoVoto {
  alumno_nombre: string
  alumno_email: string
  modometro_voto: 'bien' | 'perdido' | 'rapido' | null
  pide_palabra: boolean
  duda_texto: string | null
}

interface MensajeChat {
  id: string
  nombre: string
  email: string
  texto: string
  timestamp: string
  sistema?: boolean
}

export default function AulaVirtualPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const supabase = createClient()

  // Saneamiento de UUID para clases demostrativas o IDs personalizados
  const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
  const claseId = isUUID(id) ? id : 'd0000000-0000-0000-0000-000000000000'

  // ─────────────────────────────────────────────────────────────
  // ESTADOS PRINCIPALES
  // ─────────────────────────────────────────────────────────────
  const [clase, setClase] = useState<ClaseVirtual | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'alumno' | 'profesor'>('alumno')
  const [espectadores, setEspectadores] = useState(42)

  // Datos del alumno actual (se guardan en localStorage)
  const [alumnoNombre, setAlumnoNombre] = useState('')
  const [alumnoEmail, setAlumnoEmail] = useState('')
  const [isRegistrado, setIsRegistrado] = useState(false)
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)

  // Estados de interacción del Alumno
  const [votoActual, setVotoActual] = useState<'bien' | 'perdido' | 'rapido' | null>(null)
  const [dudaModalOpen, setDudaModalOpen] = useState(false)
  const [dudaTexto, setDudaTexto] = useState('')
  const [pidePalabraActivo, setPidePalabraActivo] = useState(false)

  // Estados de datos en tiempo real (para el Profesor)
  const [interacciones, setInteracciones] = useState<AlumnoVoto[]>([])
  
  // Chat en tiempo real (Broadcast)
  const [chatMessages, setChatMessages] = useState<MensajeChat[]>([
    { id: '1', nombre: 'Sistema', email: 'sistema@itec.edu.ar', texto: '¡Te damos la bienvenida al Aula Virtual de ITEC Saladillo! Participá de forma interactiva.', timestamp: '18:00', sistema: true },
    { id: '2', nombre: 'Martín Rodríguez', email: 'martin@gmail.com', texto: 'Buenas tardes a todos, excelente temática la de hoy.', timestamp: '18:02' },
    { id: '3', nombre: 'Sofía Gallego', email: 'sofia@outlook.com', texto: 'Hola profe! Se escucha y se ve genial.', timestamp: '18:03' }
  ])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Simulación de controles de video
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(35)

  // ─────────────────────────────────────────────────────────────
  // CARGA INICIAL Y LOCALSTORAGE
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Cargar perfil del alumno si existe en localStorage
    const savedNombre = localStorage.getItem('itec_alumno_nombre')
    const savedEmail = localStorage.getItem('itec_alumno_email')
    
    if (savedNombre && savedEmail) {
      setAlumnoNombre(savedNombre)
      setAlumnoEmail(savedEmail)
      setIsRegistrado(true)
    } else {
      setRegistrationModalOpen(true)
    }

    // 2. Fetch inicial de la clase virtual
    async function loadClase() {
      try {
        const { data, error } = await supabase
          .from('clases_virtuales')
          .select('*')
          .eq('id', claseId)
          .single()

        if (error || !data) {
          // Si no existe, creamos una de prueba para que la experiencia sea robusta e inmediata
          console.log('Clase no encontrada, creando clase de demostración...')
          const demoClase = {
            id: claseId,
            titulo: 'Seminario Avanzado de Inteligencia Artificial y Machine Learning',
            url_stream: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            estado_sidebar: 'chat'
          }
          
          const { error: insertError } = await supabase
            .from('clases_virtuales')
            .upsert(demoClase)

          if (insertError) {
            console.error('Error al insertar clase demo:', insertError.message)
          }
          setClase(demoClase as ClaseVirtual)
        } else {
          setClase(data as ClaseVirtual)
        }
      } catch (err) {
        console.error('Error cargando la clase:', err)
      } finally {
        setLoading(false)
      }
    }

    loadClase()

    // Fluctuación realista de espectadores
    const interval = setInterval(() => {
      setEspectadores(prev => {
        const diff = Math.floor(Math.random() * 5) - 2
        const next = prev + diff
        return next > 5 ? next : 5
      })
    }, 8000)

    return () => clearInterval(interval)
  }, [id, supabase])

  // ─────────────────────────────────────────────────────────────
  // SUSCRIPCIONES REALTIME (SUPABASE)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!clase) return

    // CANAL 1: Cambios en la clase virtual (conmutar sidebar en tiempo real)
    const claseChannel = supabase
      .channel(`clase-${claseId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clases_virtuales',
          filter: `id=eq.${claseId}`
        },
        (payload) => {
          console.log('Cambio en clases_virtuales detectado:', payload.new)
          setClase(payload.new as ClaseVirtual)
        }
      )
      .subscribe()

    // CANAL 2: Interacciones de la clase (votos y pedidos de palabra) para el Profesor/Orador
    const interaccionesChannel = supabase
      .channel(`interacciones-${claseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clase_interacciones',
          filter: `clase_id=eq.${claseId}`
        },
        () => {
          // Recargar interacciones activas
          fetchInteracciones()
        }
      )
      .subscribe()

    // CANAL 3: Chat Broadcast (Mensajes en vivo ultra-rápidos sin persistir en BD)
    const chatChannel = supabase.channel(`chat-broadcast-${claseId}`, {
      config: {
        broadcast: { self: false }
      }
    })

    chatChannel
      .on('broadcast', { event: 'msg' }, (payload) => {
        const msg = payload.payload as MensajeChat
        setChatMessages(prev => [...prev, msg])
      })
      .subscribe()

    // Carga inicial de interacciones
    fetchInteracciones()

    // Auto-scroll del chat
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    return () => {
      supabase.removeChannel(claseChannel)
      supabase.removeChannel(interaccionesChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [clase, claseId, supabase])

  // Scroll del chat al recibir mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ─────────────────────────────────────────────────────────────
  // ACCIONES / MÉTODOS
  // ─────────────────────────────────────────────────────────────

  // Fetch de interacciones desde Supabase
  const fetchInteracciones = async () => {
    const { data, error } = await supabase
      .from('clase_interacciones')
      .select('alumno_nombre, alumno_email, modometro_voto, pide_palabra, duda_texto')
      .eq('clase_id', claseId)

    if (!error && data) {
      setInteracciones(data as AlumnoVoto[])
      
      // Si soy alumno, actualizar mi estado local basado en la base de datos
      if (alumnoEmail) {
        const miVoto = data.find(i => i.alumno_email === alumnoEmail)
        if (miVoto) {
          setVotoActual(miVoto.modometro_voto)
          setPidePalabraActivo(miVoto.pide_palabra)
        }
      }
    }
  }

  // Guardar perfil inicial del Alumno
  const handleRegistrar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alumnoNombre.trim() || !alumnoEmail.trim()) return

    localStorage.setItem('itec_alumno_nombre', alumnoNombre.trim())
    localStorage.setItem('itec_alumno_email', alumnoEmail.trim())
    setIsRegistrado(true)
    setRegistrationModalOpen(false)
    
    // Recargar interacciones para este correo si ya existían
    fetchInteracciones()
  }

  // Cerrar sesión local (para pruebas)
  const handleResetPerfil = () => {
    localStorage.removeItem('itec_alumno_nombre')
    localStorage.removeItem('itec_alumno_email')
    setAlumnoNombre('')
    setAlumnoEmail('')
    setIsRegistrado(false)
    setRegistrationModalOpen(true)
  }

  // Registrar voto del Modómetro (UPSERT)
  const handleVotarModometro = async (voto: 'bien' | 'perdido' | 'rapido') => {
    if (!isRegistrado) {
      setRegistrationModalOpen(true)
      return
    }

    setVotoActual(voto)

    const payload = {
      clase_id: claseId,
      alumno_nombre: alumnoNombre,
      alumno_email: alumnoEmail,
      modometro_voto: voto,
      // Mantenemos el estado de pide_palabra si ya existía
      pide_palabra: pidePalabraActivo
    }

    const { error } = await supabase
      .from('clase_interacciones')
      .upsert(payload, { onConflict: 'clase_id,alumno_email' })

    if (error) {
      console.error('Error al votar en el modómetro:', error.message)
    }
  }

  // Enviar duda / Pedir Palabra (UPSERT)
  const handleEnviarDuda = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isRegistrado) {
      setRegistrationModalOpen(true)
      return
    }
    if (!dudaTexto.trim()) return

    setPidePalabraActivo(true)
    setDudaModalOpen(false)

    const payload = {
      clase_id: claseId,
      alumno_nombre: alumnoNombre,
      alumno_email: alumnoEmail,
      pide_palabra: true,
      duda_texto: dudaTexto.trim(),
      // Mantenemos el modómetro si ya votó
      modometro_voto: votoActual
    }

    const { error } = await supabase
      .from('clase_interacciones')
      .upsert(payload, { onConflict: 'clase_id,alumno_email' })

    if (error) {
      console.error('Error al enviar duda:', error.message)
    } else {
      setDudaTexto('')
      
      // Publicar en chat de forma opcional para enriquecer la interfaz
      enviarMensajeSistema(`Mano levantada: "${payload.duda_texto}"`)
    }
  }

  // Cancelar pedido de palabra (Alumno)
  const handleCancelarDuda = async () => {
    setPidePalabraActivo(false)

    const payload = {
      clase_id: claseId,
      alumno_nombre: alumnoNombre,
      alumno_email: alumnoEmail,
      pide_palabra: false,
      duda_texto: null,
      modometro_voto: votoActual
    }

    const { error } = await supabase
      .from('clase_interacciones')
      .upsert(payload, { onConflict: 'clase_id,alumno_email' })

    if (error) {
      console.error('Error al cancelar pedido de palabra:', error.message)
    }
  }

  // Enviar mensaje de chat (Broadcast)
  const handleEnviarMensajeChat = () => {
    if (!isRegistrado) {
      setRegistrationModalOpen(true)
      return
    }
    if (!nuevoMensaje.trim()) return

    const msg: MensajeChat = {
      id: Math.random().toString(),
      nombre: alumnoNombre,
      email: alumnoEmail,
      texto: nuevoMensaje.trim(),
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }

    // Emitir mensaje por el canal Broadcast
    supabase.channel(`chat-broadcast-${claseId}`).send({
      type: 'broadcast',
      event: 'msg',
      payload: msg
    })

    // Añadirlo localmente
    setChatMessages(prev => [...prev, msg])
    setNuevoMensaje('')
  }

  // Helper para enviar notificaciones del sistema por chat
  const enviarMensajeSistema = (texto: string) => {
    const msg: MensajeChat = {
      id: Math.random().toString(),
      nombre: 'Sistema',
      email: 'sistema@itec.edu.ar',
      texto,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      sistema: true
    }

    supabase.channel(`chat-broadcast-${claseId}`).send({
      type: 'broadcast',
      event: 'msg',
      payload: msg
    })

    setChatMessages(prev => [...prev, msg])
  }

  // ─────────────────────────────────────────────────────────────
  // ACCIONES EXCLUSIVAS DEL ORADOR / PROFESOR
  // ─────────────────────────────────────────────────────────────

  // Cambiar estado de barra lateral para toda la clase
  const handleCambiarEstadoSidebar = async (nuevoEstado: 'chat' | 'modometro') => {
    if (!clase) return

    const { error } = await supabase
      .from('clases_virtuales')
      .update({ estado_sidebar: nuevoEstado })
      .eq('id', claseId)

    if (error) {
      console.error('Error al cambiar estado del sidebar:', error.message)
    } else {
      setClase(prev => prev ? { ...prev, estado_sidebar: nuevoEstado } : null)
      enviarMensajeSistema(`El orador cambió la vista activa a: ${nuevoEstado === 'chat' ? '💬 Chat Grupal' : '📊 Modómetro Cognitivo'}`)
    }
  }

  // Despejar pedido de palabra / duda (Profesor)
  const handleResolverDuda = async (email: string) => {
    const interaccion = interacciones.find(i => i.alumno_email === email)
    if (!interaccion) return

    const payload = {
      clase_id: claseId,
      alumno_nombre: interaccion.alumno_nombre,
      alumno_email: interaccion.alumno_email,
      pide_palabra: false,
      duda_texto: null,
      modometro_voto: interaccion.modometro_voto
    }

    const { error } = await supabase
      .from('clase_interacciones')
      .upsert(payload, { onConflict: 'clase_id,alumno_email' })

    if (error) {
      console.error('Error al resolver duda:', error.message)
    }
  }

  // Reiniciar votos del modómetro (Profesor)
  const handleReiniciarModometro = async () => {
    // Para simplificar, hacemos un update masivo de modometro_voto a null
    // en todas las interacciones de esta clase
    const { error } = await supabase
      .from('clase_interacciones')
      .update({ modometro_voto: null })
      .eq('clase_id', claseId)

    if (error) {
      console.error('Error al reiniciar modómetro:', error.message)
    } else {
      enviarMensajeSistema('📊 El orador ha reiniciado el Modómetro Cognitivo.')
    }
  }

  // ─────────────────────────────────────────────────────────────
  // COMPUTACIÓN DE MÉTRICAS (PROFESOR)
  // ─────────────────────────────────────────────────────────────
  const totalVotos = interacciones.filter(i => i.modometro_voto !== null).length
  const votosBien = interacciones.filter(i => i.modometro_voto === 'bien').length
  const votosPerdido = interacciones.filter(i => i.modometro_voto === 'perdido').length
  const votosRapido = interacciones.filter(i => i.modometro_voto === 'rapido').length

  const pctBien = totalVotos > 0 ? Math.round((votosBien / totalVotos) * 100) : 0
  const pctPerdido = totalVotos > 0 ? Math.round((votosPerdido / totalVotos) * 100) : 0
  const pctRapido = totalVotos > 0 ? Math.round((votosRapido / totalVotos) * 100) : 0

  const dudasActivas = interacciones.filter(i => i.pide_palabra && i.duda_texto)

  // ─────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center font-sans text-slate-100">
        <div className="w-12 h-12 rounded-full border-t-2 border-emerald-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-semibold">Sincronizando con el Aula Virtual de ITEC...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06080e] flex flex-col font-sans text-slate-100 relative overflow-hidden">
      
      {/* ─────────────────────────────────────────────────────────────
          BARRA FLOTANTE DE SIMULACIÓN DE ROL (DESARROLLO)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0b0e17]/95 border-b border-slate-800/80 px-4 py-2 flex flex-wrap justify-between items-center z-50 text-xs shadow-md backdrop-blur-md relative gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Consola de Testeo Dual</span>
          <span className="text-slate-600">|</span>
          <p className="text-slate-400 hidden sm:inline">
            Probá el comportamiento en tiempo real interactuando con dos pestañas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Simular Rol:</span>
          
          <button 
            onClick={() => setUserRole('alumno')}
            className={`py-1.5 px-3 rounded-lg font-semibold tracking-wide transition-all duration-200 ${userRole === 'alumno' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-slate-300'}`}
          >
            Alumno
          </button>
          <button 
            onClick={() => setUserRole('profesor')}
            className={`py-1.5 px-3 rounded-lg font-semibold tracking-wide transition-all duration-200 ${userRole === 'profesor' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-slate-300'}`}
          >
            Orador / Profesor
          </button>

          {isRegistrado && userRole === 'alumno' && (
            <>
              <span className="text-slate-700">|</span>
              <button 
                onClick={handleResetPerfil}
                className="text-slate-400 hover:text-slate-300 underline font-medium"
                title="Cambiar credenciales locales de alumno"
              >
                Perfil: {alumnoNombre.split(' ')[0]}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Glow decorativo de fondo */}
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-950/5 blur-[120px] pointer-events-none" />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-45px)]">
        
        {/* COLUMNA IZQUIERDA: REPRODUCTOR DE STREAMING (PANTALLA DIVIDIDA) */}
        <div className="flex-1 flex flex-col p-4 md:p-6 justify-between gap-4 overflow-y-auto">
          
          {/* Contenedor del Reproductor Premium */}
          <div className="w-full flex-1 flex flex-col justify-center">
            <div className="w-full aspect-video bg-black rounded-2xl border border-slate-900 relative overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.7)] max-w-4xl mx-auto">
              
              {/* Controles de Simulación de Streaming */}
              <div className="absolute inset-0 flex items-center justify-center bg-[#070b13]/85 group-hover:bg-[#070b13]/60 transition-all duration-300">
                
                {/* Indicador EN VIVO pulsante en el video */}
                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  EN VIVO
                </div>

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{espectadores} viendo</span>
                </div>

                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-400 transition-colors"
                  >
                    {isPlaying ? <Volume2 className="w-8 h-8" /> : <Play className="w-8 h-8 pl-1" />}
                  </motion.div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">
                      {isPlaying ? 'Audio de la transmisión activado' : 'Hacé clic para reproducir el stream en vivo'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Simulación interactiva de clase por streaming. Modificá el volumen y los controles.
                    </p>
                  </div>
                </div>

                {/* Barra de Controles Inferior del Player */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="text-slate-300 hover:text-white transition-colors">
                      {isPlaying ? <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm inline-block" /> : <Play className="w-4 h-4 fill-slate-300" />}
                    </button>
                    
                    <button onClick={() => setIsMuted(!isMuted)} className="text-slate-300 hover:text-white transition-colors">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    {/* Timeline ficticia */}
                    <div className="w-48 md:w-80 h-1 bg-slate-800 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 bottom-0 bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">1:24:32</span>
                  </div>

                  <button className="text-slate-300 hover:text-white transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Información de la Clase Debajo del Player */}
          <div className="max-w-4xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d121c]/45 border border-slate-900 p-5 rounded-2xl backdrop-blur-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider">
                  Aula Interactiva
                </span>
                <p className="text-xs text-slate-500 font-medium">Clase ID: {claseId.substring(0, 8)}...</p>
              </div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-100">
                {clase?.titulo}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                Esta clase virtual incorpora el sistema interactivo de ITEC Saladillo. A la derecha verás las actualizaciones en tiempo real del modómetro y el chat grupal coordinado por el docente.
              </p>
            </div>

            {/* BOTÓN DE INTERRUPCIÓN RESPETUOSA (ALUMNO) */}
            {userRole === 'alumno' && (
              <div className="shrink-0 w-full md:w-auto">
                <AnimatePresence mode="wait">
                  {pidePalabraActivo ? (
                    <motion.button
                      key="cancelar-palabra"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={handleCancelarDuda}
                      className="w-full md:w-auto py-3 px-5 rounded-xl bg-rose-950/60 border border-rose-500/40 hover:bg-rose-900/40 hover:border-rose-400 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Mano Levantada (Cancelar)
                    </motion.button>
                  ) : (
                    <motion.button
                      key="pedir-palabra"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setDudaModalOpen(true)}
                      className="w-full md:w-auto py-3 px-5 rounded-xl bg-emerald-600 text-slate-950 hover:bg-emerald-500 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-emerald-600/10"
                    >
                      <Hand className="w-4 h-4 fill-slate-950" />
                      Pedir Palabra / Tengo una Duda
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

        {/* COLUMNA DERECHA: SIDEBAR ADAPTATIVO (PANTALLA DIVIDIDA) */}
        <div className="w-full lg:w-96 bg-[#0b0e14] border-t lg:border-t-0 lg:border-l border-slate-900 flex flex-col h-full overflow-hidden">
          
          {/* Header del Sidebar */}
          <div className="px-4 py-3 bg-[#0d121c] border-b border-slate-950 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                {clase?.estado_sidebar === 'chat' ? <MessageSquare className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {clase?.estado_sidebar === 'chat' ? 'Chat de la Clase' : 'Modómetro Activo'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {userRole === 'alumno' ? 'Vista Alumno' : 'Consola de Profesor'}
                </p>
              </div>
            </div>

            {/* Indicador de estado */}
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              En Línea
            </span>
          </div>

          {/* CUERPO DEL SIDEBAR (RUTEO DUAL DE ROLES) */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            <AnimatePresence mode="wait">
              {/* ROLES Y VISTAS */}
              
              {/* ─────────────────────────────────────────────────────────────
                  A: SIDEBAR VISTA DEL DOCENTE (PROFESOR)
                  ───────────────────────────────────────────────────────────── */}
              {userRole === 'profesor' ? (
                <motion.div 
                  key="sidebar-profesor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col p-4 overflow-y-auto space-y-6"
                >
                  {/* Selector del estado del sidebar global */}
                  <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Control de la Clase</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Conmutá la interfaz de toda la clase en tiempo real para todos los alumnos conectados.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleCambiarEstadoSidebar('chat')}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${clase?.estado_sidebar === 'chat' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Ver Chat
                      </button>
                      
                      <button
                        onClick={() => handleCambiarEstadoSidebar('modometro')}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${clase?.estado_sidebar === 'modometro' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'}`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Ver Modómetro
                      </button>
                    </div>
                  </div>

                  {/* Consola Consolidada del Modómetro (Votos en vivo) */}
                  <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Estado del Modómetro</h4>
                      </div>
                      
                      <button 
                        onClick={handleReiniciarModometro}
                        className="text-[9px] bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-300 py-1 px-2 rounded-lg font-bold transition-all duration-200"
                      >
                        Reiniciar
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Opción 1: Bien */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300 flex items-center gap-1">Voy bien 👍 <span className="text-slate-500 font-normal">({votosBien})</span></span>
                          <span className="text-emerald-400 font-bold">{pctBien}%</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pctBien}%` }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full" 
                          />
                        </div>
                      </div>

                      {/* Opción 2: Perdido */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300 flex items-center gap-1">Me perdí 😵 <span className="text-slate-500 font-normal">({votosPerdido})</span></span>
                          <span className="text-amber-500 font-bold">{pctPerdido}%</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pctPerdido}%` }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-y-0 left-0 bg-amber-500 rounded-full" 
                          />
                        </div>
                      </div>

                      {/* Opción 3: Rápido */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300 flex items-center gap-1">Muy rápido ⚡ <span className="text-slate-500 font-normal">({votosRapido})</span></span>
                          <span className="text-cyan-400 font-bold">{pctRapido}%</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pctRapido}%` }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-y-0 left-0 bg-cyan-400 rounded-full" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 text-center border-t border-slate-950 pt-3">
                      Total de votos activos en tiempo real: <strong className="text-slate-300">{totalVotos}</strong>
                    </div>
                  </div>

                  {/* Cola de Interrupción Respetuosa (Mano Levantada) */}
                  <div className="bg-[#0d121c]/60 border border-slate-900 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-1.5">
                      <Hand className="w-4 h-4 text-rose-500" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Cola de Preguntas ({dudasActivas.length})</h4>
                    </div>

                    {dudasActivas.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 border border-dashed border-slate-900 rounded-xl">
                        <p className="text-[10px] font-bold">Sin consultas activas</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">La palabra de los alumnos está libre.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {dudasActivas.map((duda, idx) => (
                          <motion.div 
                            key={duda.alumno_email}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-950/75 border border-slate-900 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-xs font-bold text-slate-200">{duda.alumno_nombre}</h5>
                                <p className="text-[8px] text-slate-500 font-mono">{duda.alumno_email}</p>
                              </div>
                              <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                #{idx + 1} duda
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 italic bg-[#0b0e14] p-2 rounded-lg border border-slate-950">
                              "{duda.duda_texto}"
                            </p>

                            <div className="flex gap-1.5 pt-1 justify-end">
                              <button
                                onClick={() => handleResolverDuda(duda.alumno_email)}
                                className="py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-[10px] font-bold border border-emerald-500/20 transition-all duration-200"
                              >
                                Dar Palabra / Listo
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                </motion.div>
              ) : (
                /* ─────────────────────────────────────────────────────────────
                    B: SIDEBAR VISTA DEL ESTUDIANTE (ALUMNO)
                    ───────────────────────────────────────────────────────────── */
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Vista 1: Chat de la Clase */}
                  {clase?.estado_sidebar === 'chat' && (
                    <motion.div 
                      key="student-chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                      {/* Lista de Mensajes del Chat */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                        {chatMessages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${msg.sistema ? 'items-center my-2' : ''}`}
                          >
                            {msg.sistema ? (
                              <div className="bg-[#121927] border border-emerald-500/10 px-3 py-1.5 rounded-xl text-center max-w-[90%] flex items-start gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="text-[10px] text-slate-400 leading-normal font-medium italic">
                                  {msg.texto}
                                </span>
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

                      {/* Input de Mensajes del Chat */}
                      <div className="p-3 bg-[#0d121c] border-t border-slate-950 flex gap-2 shrink-0">
                        <input
                          type="text"
                          value={nuevoMensaje}
                          onChange={(e) => setNuevoMensaje(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEnviarMensajeChat()}
                          placeholder={isRegistrado ? "Escribí tu mensaje..." : "Registrate para interactuar"}
                          disabled={!isRegistrado}
                          className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors"
                        />
                        <button
                          onClick={handleEnviarMensajeChat}
                          disabled={!isRegistrado || !nuevoMensaje.trim()}
                          className="w-8 h-8 rounded-xl bg-emerald-600 text-slate-950 flex items-center justify-center hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600"
                        >
                          <Send className="w-3.5 h-3.5 fill-slate-950" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Vista 2: Modómetro Cognitivo Estudiante */}
                  {clase?.estado_sidebar === 'modometro' && (
                    <motion.div 
                      key="student-modometro"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col p-6 items-center justify-center text-center space-y-6"
                    >
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 mb-3 animate-pulse">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Modómetro de Comprensión</h4>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                          Contale al orador cómo venís siguiendo la explicación en este momento.
                        </p>
                      </div>

                      {/* Botones del Modómetro */}
                      <div className="w-full space-y-3.5 max-w-[280px]">
                        
                        {/* Opción 1: Voy Bien */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleVotarModometro('bien')}
                          className={`w-full py-4 px-5 rounded-2xl text-left border flex justify-between items-center transition-all duration-300 ${votoActual === 'bien' ? 'bg-emerald-950/60 border-emerald-500/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">👍</span>
                            <span className="text-xs font-bold tracking-wide">Voy bien</span>
                          </div>
                          {votoActual === 'bien' && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                        </motion.button>

                        {/* Opción 2: Me Perdí */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleVotarModometro('perdido')}
                          className={`w-full py-4 px-5 rounded-2xl text-left border flex justify-between items-center transition-all duration-300 ${votoActual === 'perdido' ? 'bg-amber-950/60 border-amber-500/50 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">😵</span>
                            <span className="text-xs font-bold tracking-wide">Me perdí</span>
                          </div>
                          {votoActual === 'perdido' && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
                        </motion.button>

                        {/* Opción 3: Muy Rápido */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleVotarModometro('rapido')}
                          className={`w-full py-4 px-5 rounded-2xl text-left border flex justify-between items-center transition-all duration-300 ${votoActual === 'rapido' ? 'bg-cyan-950/60 border-cyan-500/50 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            <span className="text-xs font-bold tracking-wide">Muy rápido</span>
                          </div>
                          {votoActual === 'rapido' && <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />}
                        </motion.button>

                      </div>

                      <div className="text-[10px] text-slate-500 italic max-w-[200px] mx-auto leading-normal">
                        Podés cambiar tu voto en cualquier momento a medida que progrese la clase.
                      </div>
                    </motion.div>
                  )}

                </div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: REGISTRO/IDENTIFICACIÓN DE ALUMNO
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {registrationModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-w-md w-full bg-[#0d121c] border border-slate-800 rounded-3xl p-6 md:p-8 relative shadow-2xl overflow-hidden"
            >
              {/* Filigrana superior esmeralda */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 to-amber-500" />
              
              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-2">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Ingreso al Aula Virtual</h3>
                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  Ingresá tus credenciales de ITEC para sincronizar tus aportes y modómetro en tiempo real con la clase del docente.
                </p>
              </div>

              <form onSubmit={handleRegistrar} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={alumnoNombre}
                    onChange={(e) => setAlumnoNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-800 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={alumnoEmail}
                    onChange={(e) => setAlumnoEmail(e.target.value)}
                    placeholder="Ej. juan.perez@itec.edu.ar"
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-800 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all duration-200 shadow-md hover:shadow-emerald-600/10"
                  >
                    Ingresar al Aula en Vivo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: INTERRUPCIÓN RESPETUOSA (Tengo una duda)
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {dudaModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="max-w-md w-full bg-[#0d121c]/90 border border-slate-800 rounded-2xl p-6 relative shadow-2xl backdrop-blur-xl"
            >
              <button 
                onClick={() => setDudaModalOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-3 mb-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400">
                  <Hand className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Pedir Palabra / Interrupción Respetuosa</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Al enviar tu duda, se levantará tu mano de forma virtual en la pantalla del docente para que te asigne la palabra de manera organizada.
                  </p>
                </div>
              </div>

              <form onSubmit={handleEnviarDuda} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Describí brevemente tu duda</label>
                  <textarea
                    required
                    maxLength={120}
                    value={dudaTexto}
                    onChange={(e) => setDudaTexto(e.target.value)}
                    placeholder="Ej. ¿Podría volver a explicar la arquitectura del Transformer?"
                    className="w-full h-24 bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors resize-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 px-1">
                    <span>Sé lo más breve y directo posible.</span>
                    <span>{dudaTexto.length}/120</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDudaModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-350 text-xs font-bold border border-slate-900 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all duration-200 shadow-md hover:shadow-emerald-600/10"
                  >
                    Levantar Mano ✋
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
