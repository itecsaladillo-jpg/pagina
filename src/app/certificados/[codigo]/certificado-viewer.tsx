'use client'

import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Award, 
  Calendar, 
  User, 
  FileCheck, 
  ShieldAlert, 
  Download, 
  Share2, 
  Cpu, 
  Code, 
  Database, 
  Globe, 
  Layers, 
  Workflow,
  Smartphone,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import QRCode from 'react-qr-code'

interface Certificado {
  codigo: string
  alumno_nombre: string
  capacitacion_nombre: string
  fecha_emision: string
  habilidades: string[]
}

interface CertificadoViewerProps {
  certificado: Certificado | null
  codigo: string
}

// Helper para asignar iconos a las habilidades
const getHabilidadIcon = (habilidad: string) => {
  const h = habilidad.toLowerCase()
  if (h.includes('ia') || h.includes('inteligencia') || h.includes('artificial')) return <Cpu className="w-5 h-5 text-emerald-400" />
  if (h.includes('code') || h.includes('react') || h.includes('next') || h.includes('javascript') || h.includes('typescript')) return <Code className="w-5 h-5 text-amber-400" />
  if (h.includes('data') || h.includes('base') || h.includes('sql') || h.includes('supabase')) return <Database className="w-5 h-5 text-blue-400" />
  if (h.includes('web') || h.includes('frontend') || h.includes('cloud')) return <Globe className="w-5 h-5 text-cyan-400" />
  if (h.includes('design') || h.includes('ux') || h.includes('ui') || h.includes('estilo') || h.includes('css')) return <Layers className="w-5 h-5 text-purple-400" />
  if (h.includes('git') || h.includes('agiles') || h.includes('gestion') || h.includes('proyectos')) return <Workflow className="w-5 h-5 text-rose-400" />
  return <Award className="w-5 h-5 text-amber-500" />
}

export default function CertificadoViewer({ certificado, codigo }: CertificadoViewerProps) {
  const diplomaRef = useRef<HTMLDivElement>(null)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Certificado Oficial ITEC - ${certificado?.alumno_nombre}`,
        text: `Verificación pública del certificado de ${certificado?.alumno_nombre} en ${certificado?.capacitacion_nombre}.`,
        url: window.location.href,
      }).catch(err => console.log('Error compartiendo:', err))
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('¡Enlace copiado al portapapeles!')
    }
  }

  // Si no es válido
  if (!certificado) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Glows de fondo */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-rose-900/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-amber-900/5 blur-3xl" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full bg-[#0d131f]/90 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative"
        >
          {/* Filigrana roja de alerta */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 rounded-t-2xl" />
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-xl font-bold text-slate-100 mb-2">Código de Verificación Inválido</h1>
            <p className="text-sm text-slate-400 mb-6">
              El código de validación <span className="font-mono text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-950">{codigo}</span> no corresponde a un certificado oficial vigente emitido por ITEC Saladillo.
            </p>

            <div className="bg-[#121927] border border-slate-800 rounded-xl p-4 text-left w-full space-y-3 mb-6 text-xs text-slate-300">
              <p className="font-semibold text-slate-200">Recomendaciones:</p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Verificá que los caracteres ingresados coincidan exactamente con los impresos en el diploma original (distingue mayúsculas y minúsculas).</li>
                <li>Si creés que se trata de un error institucional, por favor ponete en contacto con la administración central de ITEC para auditar tu pasaporte de habilidades digitales.</li>
              </ul>
            </div>

            <a 
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-semibold transition-all duration-200 border border-slate-700 text-center"
            >
              Volver al Inicio
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  const { alumno_nombre, capacitacion_nombre, fecha_emision, habilidades } = certificado

  // Formateo de fecha
  const formattedDate = new Date(fecha_emision + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-between py-12 px-4 relative overflow-hidden font-sans text-slate-100">
      
      {/* Luces y glows de fondo premium */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-950/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-950/10 blur-[120px] pointer-events-none" />

      {/* Grid de textura de fondo (lino) */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full relative z-10 my-4">
        
        {/* Barra superior del visor */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0d131f] border border-emerald-500/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Portal de Validación Pública</p>
              <h2 className="text-sm font-bold text-slate-200">ITEC Saladillo — Habilidades Verificadas</h2>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="py-2 px-4 rounded-xl bg-[#0d131f] border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-xs font-semibold flex items-center gap-2 transition-all duration-200 text-slate-300"
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartir Validación
            </button>
          </div>
        </div>

        {/* CONTENEDOR DIPLOMA PREMIUM */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full bg-[#0b0e14] border border-amber-500/20 rounded-3xl p-6 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
          ref={diplomaRef}
        >
          {/* Filigranas doradas y esquineros de marco de diploma */}
          <div className="absolute inset-4 border border-amber-500/10 rounded-2xl pointer-events-none" />
          <div className="absolute inset-6 border border-amber-500/5 rounded-xl pointer-events-none" />
          
          {/* Esquinas decorativas doradas */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-amber-500/35 rounded-tl pointer-events-none" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-amber-500/35 rounded-tr pointer-events-none" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-amber-500/35 rounded-bl pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-amber-500/35 rounded-br pointer-events-none" />

          {/* Destello elegante de luz dorada */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 relative z-10">
            
            {/* Cédula Principal del Diploma (Izquierda en desktop, 8 columnas) */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-8">
              
              {/* Encabezado */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-px w-8 bg-amber-500/50" />
                  <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">Certificación Oficial Digital</span>
                  <span className="h-px w-8 bg-amber-500/50" />
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-100 font-serif">
                  ITEC SALADILLO
                </h1>
                <p className="text-xs text-slate-400 italic max-w-lg leading-relaxed">
                  Instituto Tecnológico de Saladillo. Formación de vanguardia tecnológica, innovación productiva y desarrollo regional de alta competencia.
                </p>
              </div>

              {/* Declaración */}
              <div className="space-y-4 my-2">
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Por cuanto se ha constatado el cumplimiento de todos los requisitos académicos:
                </p>
                
                <div className="space-y-1">
                  <p className="text-xs text-amber-500/80 font-medium">Se otorga el presente Pasaporte de Habilidades a</p>
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm font-serif">
                    {alumno_nombre}
                  </h3>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                  En reconocimiento a la culminación exitosa de la capacitación y desarrollo intensivo del programa superior en: 
                  <strong className="text-slate-100 block mt-1 text-lg font-semibold tracking-tight">
                    {capacitacion_nombre}
                  </strong>
                </p>
              </div>

              {/* Sello Verde Interactivo Animado */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-900">
                <div className="flex items-center gap-3">
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.3
                    }}
                    className="w-14 h-14 rounded-full bg-emerald-950/65 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </motion.div>
                  
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">Autenticidad Validada</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-300">Documento Oficial de ITEC</p>
                    <p className="text-[10px] text-slate-500 font-mono">HASH: {codigo.substring(0, 16)}...</p>
                  </div>
                </div>

                <div className="flex flex-col text-xs text-slate-400 border-l border-slate-800 pl-6 py-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Emisión: <strong className="text-slate-300 font-semibold">{formattedDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>ID Validación: <strong className="text-slate-300 font-mono">{codigo}</strong></span>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar del Diploma (Derecha en desktop, 4 columnas) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-6 lg:border-l lg:border-slate-900 lg:pl-8">
              
              {/* Código QR para verificación física móvil */}
              <div className="flex flex-col items-center bg-[#0d121c] border border-slate-900 rounded-2xl p-5 text-center relative group">
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-semibold text-slate-500 uppercase tracking-widest">
                  <Smartphone className="w-2.5 h-2.5" />
                  Escanear
                </div>
                
                <div className="w-32 h-32 bg-white p-2.5 rounded-xl shadow-inner mb-3 transition-transform duration-300 group-hover:scale-[1.03]">
                  <QRCode 
                    value={typeof window !== 'undefined' ? window.location.href : `https://itec-cicre.vercel.app/certificados/${codigo}`}
                    size={108} 
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Verificación en Dispositivo</h4>
                <p className="text-[10px] text-slate-500 leading-normal px-2">
                  Escaneá el código QR con cualquier smartphone para contrastar la autenticidad e integridad del certificado en los servidores centrales de ITEC.
                </p>
              </div>

              {/* Cuadrícula de Pasaporte de Habilidades Digitales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold tracking-widest text-amber-500/90 uppercase">Habilidades Validadas</h4>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                    {habilidades.length} Habilidades
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {habilidades.map((hab, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx, duration: 0.4 }}
                      className="flex items-center gap-3 bg-[#0d121c]/70 border border-slate-900 rounded-xl p-2.5 hover:border-slate-800 transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#070b13] flex items-center justify-center shrink-0 border border-slate-800/40">
                        {getHabilidadIcon(hab)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{hab}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">Aprobado y Evaluado</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </motion.div>
        
        {/* Leyenda legal al pie del diploma */}
        <div className="mt-8 text-center text-[10px] text-slate-500 leading-relaxed max-w-2xl px-4">
          Este pasaporte de habilidades digitales e insignia digital ha sido firmado criptográficamente y registrado oficialmente en el repositorio educativo del Instituto Tecnológico de Saladillo. La visualización de este perfil constituye una acreditación legal y de acceso público conforme a las normas académicas vigentes de ITEC Saladillo.
        </div>

      </main>

      {/* Footer corporativo de ITEC */}
      <footer className="w-full text-center py-6 border-t border-slate-900/60 mt-12 text-slate-600 text-xs flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto gap-4">
        <p>© 2026 Instituto Tecnológico de Saladillo. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <a href="https://itec.saladillo.gob.ar" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors flex items-center gap-1">
            Portal ITEC
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-slate-800">|</span>
          <a href="/mapa-productivo" className="hover:text-slate-400 transition-colors">Mapa Productivo</a>
        </div>
      </footer>

    </div>
  )
}
