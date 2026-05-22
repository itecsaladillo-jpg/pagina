'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Award, 
  Search, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  ExternalLink,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react'

// Interfaces
interface Certificado {
  codigo: string
  alumno_nombre: string
  capacitacion_nombre: string
  fecha_emision: string
  habilidades: string[]
}

interface CertificadosInteractiveProps {
  member: {
    full_name: string
    email: string
  }
  certificadosIniciales: Certificado[]
}

export default function CertificadosInteractive({ member, certificadosIniciales }: CertificadosInteractiveProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [certificados, setCertificados] = useState<Certificado[]>(certificadosIniciales)
  const [codigoBusqueda, setCodigoBusqueda] = useState('')
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [demoGenerado, setDemoGenerado] = useState<Certificado | null>(null)

  // 1. Manejo del Buscador de Certificados
  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigoBusqueda.trim()) return
    router.push(`/certificados/${codigoBusqueda.trim()}`)
  }

  // 2. Generación en caliente de Certificado Demo
  const handleGenerarDemo = async () => {
    setLoadingDemo(true)
    setDemoGenerado(null)
    
    const estadosDeCarga = [
      'Inicializando credenciales institucionales...',
      'Firmando diploma criptográficamente...',
      'Vinculando habilidades digitales...',
      'Guardando pasaporte en Supabase...'
    ]

    // Efecto de carga institucional premium
    for (let i = 0; i < estadosDeCarga.length; i++) {
      setStatusMessage(estadosDeCarga[i])
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    try {
      const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
      const codigoDemo = `DEMO-ITEC-${member.full_name.replace(/\s+/g, '-').toUpperCase()}-${uniqueSuffix}`
      
      const nuevoCertificado = {
        codigo: codigoDemo,
        alumno_nombre: member.full_name,
        capacitacion_nombre: 'Especialización Avanzada en Inteligencia Artificial y Desarrollo Web',
        fecha_emision: new Date().toISOString().split('T')[0],
        habilidades: [
          'Next.js 14 & Tailwind CSS',
          'Arquitectura de Base de Datos y Supabase',
          'Sincronización en Tiempo Real (Realtime)',
          'Modelos de Lenguaje Avanzados (LLMs)',
          'Dirección y Liderazgo de Células de Desarrollo'
        ]
      }

      const { error } = await supabase
        .from('certificados_digitales')
        .upsert(nuevoCertificado, { onConflict: 'codigo' })

      if (error) {
        console.error('Error insertando certificado demo:', error.message)
        setStatusMessage('Error al registrar diploma en base de datos.')
      } else {
        setDemoGenerado(nuevoCertificado)
        setCertificados(prev => [nuevoCertificado, ...prev])
        setStatusMessage('¡Pasaporte digital emitido con éxito!')
      }
    } catch (err) {
      console.error(err)
      setStatusMessage('Ocurrió un error inesperado.')
    } finally {
      setLoadingDemo(false)
    }
  }

  return (
    <div className="space-y-10">
      
      {/* ─────────────────────────────────────────────────────────────
          SECCIÓN 1: BUSCADOR & GENERADOR DEMO (CUADRÍCULA DE CONTROL)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Buscador de Certificados */}
        <div className="glass border border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-semibold tracking-wide">Validar Credencial Pública</h2>
            </div>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              Verificá la autenticidad de cualquier certificado emitido por ITEC Saladillo. Ingresá el código alfanumérico único para visualizar el diploma institucional en vivo.
            </p>
          </div>

          <form onSubmit={handleBuscar} className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: DEMO-ITEC-JUAN-PEREZ"
              value={codigoBusqueda}
              onChange={(e) => setCodigoBusqueda(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors shadow-md hover:shadow-blue-600/10"
            >
              <span>Validar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Generador de Certificado de Demostración */}
        <div className="glass border border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h2 className="text-white font-semibold tracking-wide">Simulador de Pasaporte Digital</h2>
            </div>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              ¿Querés probar la espectacular vista interactiva de tu pasaporte de habilidades? Hacé clic abajo para generar al instante tu diploma institucional oficial de demostración con tu nombre actual en el sistema.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGenerarDemo}
              disabled={loadingDemo}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md relative overflow-hidden ${
                loadingDemo 
                  ? 'bg-slate-900 border border-white/5 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black tracking-wide shadow-emerald-950/20'
              }`}
            >
              {loadingDemo ? (
                <>
                  <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse">{statusMessage}</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 fill-slate-950" />
                  <span>Emitir Certificado Demo Institucional</span>
                </>
              )}
            </button>

            {/* Notificaciones del generador */}
            <AnimatePresence mode="wait">
              {demoGenerado && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-emerald-300 font-bold">¡Diploma Generado con Éxito!</p>
                      <p className="text-[10px] text-emerald-500 font-mono mt-0.5">{demoGenerado.codigo}</p>
                    </div>
                  </div>
                  <a
                    href={`/certificados/${demoGenerado.codigo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors text-[10px]"
                  >
                    <span>Ver Diploma</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECCIÓN 2: LISTADO DE CERTIFICADOS DEL MIEMBRO
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white tracking-wide">Tus Credenciales Emitidas</h2>
          </div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
            {certificados.length} {certificados.length === 1 ? 'Credencial' : 'Credenciales'}
          </span>
        </div>

        {certificados.length === 0 ? (
          <div className="glass border border-white/5 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">No tenés credenciales emitidas todavía</h3>
              <p className="text-[var(--text-muted)] text-xs max-w-sm mx-auto leading-relaxed">
                Actualmente no registramos títulos emitidos con tu nombre oficial completo en la base de datos de ITEC. Podés generar una credencial simulada arriba para ver la experiencia.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificados.map((cert) => (
              <motion.div
                key={cert.codigo}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-white/5 transition-all duration-300 flex flex-col justify-between relative group"
              >
                {/* Glow decorativo suave */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-indigo-600/0 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

                <div className="space-y-4">
                  {/* Header tarjeta */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Credencial Oficial</span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
                        {cert.capacitacion_nombre}
                      </h3>
                    </div>
                    
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Award className="w-4 h-4 fill-indigo-400/20" />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {cert.habilidades.slice(0, 3).map((skill, index) => (
                      <span 
                        key={index} 
                        className="bg-black/40 border border-white/5 text-[9px] text-slate-400 px-2 py-0.5 rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {cert.habilidades.length > 3 && (
                      <span className="bg-black/40 border border-white/5 text-[9px] text-indigo-400 px-2 py-0.5 rounded-md font-extrabold">
                        +{cert.habilidades.length - 3} Habilidades
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer tarjeta */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>Emitido: {cert.fecha_emision}</span>
                  </div>

                  <a
                    href={`/certificados/${cert.codigo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors group-hover:translate-x-0.5 duration-200"
                  >
                    <span>Ver Diploma</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
