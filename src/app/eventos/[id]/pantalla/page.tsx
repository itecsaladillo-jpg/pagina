"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { QRCode } from "react-qr-code"
import { AlertCircle } from "lucide-react"

interface Evento {
  id: string
  nombre_evento: string
  fecha: string
  slug_qr: string
  estado_activo: boolean
}

export default function PantallaGigantePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const idParam = resolvedParams.id
  const router = useRouter()
  const supabase = createClient()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [siteUrl, setSiteUrl] = useState("")

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

        setEvento(data as Evento)
      } catch (err) {
        console.error("Error al cargar evento:", err)
      } finally {
        setLoading(false)
      }
    }

    inicializar()
  }, [idParam, supabase])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-t-transparent border-indigo-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-rose-500" />
        <h1 className="text-2xl font-black uppercase tracking-tight">Evento no disponible</h1>
        <p className="text-zinc-400">El evento no está activo o no existe.</p>
      </div>
    )
  }

  const eventUrl = `${siteUrl}/eventos/${evento.slug_qr}`

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col relative overflow-hidden select-none">

      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-black to-purple-950/20 pointer-events-none" />
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

      {/* Header con logo */}
      <header className="relative z-10 px-8 pt-6">
        <Image
          src="/logoitectrans_v2.png"
          alt="ITEC Saladillo"
          width={140}
          height={48}
          className="h-10 w-auto object-contain opacity-80"
          priority
        />
      </header>

      {/* Contenido central */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-12">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-8">

          {/* Título y bienvenida */}
          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
              Bienvenidos a
            </h1>
            <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400 leading-tight">
              {evento.nombre_evento}
            </p>
          </div>

          {/* Texto explicativo */}
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl leading-relaxed font-light">
            Acreditate escaneando el código QR con tu celular para participar en vivo: enviar preguntas al orador, usar el Semáforo de Comprensión, votar en las encuestas y participar en la nube de palabras.
          </p>

          {/* Código QR Gigante */}
          <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/10">
            <QRCode
              value={eventUrl}
              size={320}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
            />
          </div>

          {/* URL del evento debajo del QR */}
          <p className="text-base text-zinc-500 font-mono tracking-wide">
            {eventUrl}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center">
        <p className="text-sm text-zinc-600 tracking-widest uppercase font-light">
          ITEC Saladillo — Innovación · Tecnología · Emprendedurismo · Ciencia
        </p>
      </footer>
    </div>
  )
}
