import React from 'react'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CertificadosInteractive from './certificados-interactive'
import { Award } from 'lucide-react'

export const metadata = {
  title: 'Pasaporte de Habilidades Digitales — ITEC Saladillo',
  description: 'Visualizá tus habilidades digitales certificadas y diplomas institucionales oficiales.',
}

export default async function CertificadosDashboardPage() {
  const member = await getCurrentMember()

  // Control de seguridad
  if (!member) redirect('/login')
  if (member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()

  // Realizamos una consulta robusta buscando certificados emitidos al miembro logueado
  // Usamos ilike para dar flexibilidad a coincidencias (ej: acentos, mayúsculas)
  const { data: certificadosData } = await supabase
    .from('certificados_digitales')
    .select('codigo, alumno_nombre, capacitacion_nombre, fecha_emision, habilidades')
    .ilike('alumno_nombre', `%${member.full_name}%`)
    .order('fecha_emision', { ascending: false })

  // Formateamos los certificados para garantizar el tipado
  const certificados = (certificadosData || []).map((cert) => ({
    codigo: cert.codigo,
    alumno_nombre: cert.alumno_nombre,
    capacitacion_nombre: cert.capacitacion_nombre,
    fecha_emision: cert.fecha_emision,
    habilidades: cert.habilidades || []
  }))

  return (
    <div className="space-y-8">
      
      {/* Encabezado Institucional Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider">
              Miembros Activos
            </span>
            <span className="text-slate-600 text-xs">|</span>
            <p className="text-slate-500 text-xs font-medium">Pasaporte Digital institucional</p>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Pasaporte de Habilidades Digitales
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
            Tus competencias técnicas y metodológicas avaladas por ITEC Saladillo. Acreditación de aptitudes, diplomas interactivos con autenticación QR y credenciales verificables públicamente.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_8px_32px_rgba(99,102,241,0.1)]">
          <Award className="w-6 h-6 fill-indigo-400/10" />
        </div>
      </div>

      {/* Componente Interactivo Cliente */}
      <CertificadosInteractive 
        member={{
          full_name: member.full_name,
          email: member.email
        }}
        certificadosIniciales={certificados} 
      />

    </div>
  )
}
