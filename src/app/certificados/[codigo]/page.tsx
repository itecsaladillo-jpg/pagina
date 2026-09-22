import React from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CertificadoViewer from './certificado-viewer'

// Definimos la interfaz del certificado según la base de datos
interface Certificado {
  codigo: string
  alumno_nombre: string
  capacitacion_nombre: string
  fecha_emision: string
  habilidades: string[]
}

interface PageProps {
  params: Promise<{
    codigo: string
  }>
}

// 1. Generación dinámica de metadatos para SEO institucional premium
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { codigo } = await params
  const supabase = await createClient()
  
  const { data: certificado } = await supabase
    .from('certificados_digitales')
    .select('alumno_nombre, capacitacion_nombre')
    .eq('codigo', codigo)
    .single()

  if (!certificado) {
    return {
      title: 'Verificación de Certificado Inválido | ITEC Saladillo',
      description: 'El código de certificado ingresado no corresponde a un egresado o programa oficial de ITEC Saladillo.',
      robots: 'noindex, nofollow'
    }
  }

  return {
    title: `Verificación Oficial: ${certificado.alumno_nombre} | ITEC Saladillo`,
    description: `Pasaporte oficial de habilidades digitales de ITEC Saladillo. Acreditación de la capacitación en ${certificado.capacitacion_nombre} para ${certificado.alumno_nombre}.`,
    openGraph: {
      title: `Certificado de Habilidades Digitales: ${certificado.alumno_nombre}`,
      description: `Capacitación Oficial de ITEC Saladillo en ${certificado.capacitacion_nombre}.`,
      type: 'profile',
    }
  }
}

// 2. Componente de Servidor Principal
export default async function CertificadoPage({ params }: PageProps) {
  const { codigo } = await params
  const supabase = await createClient()

  // Realizamos la consulta para validar la autenticidad del certificado
  const { data, error } = await supabase
    .from('certificados_digitales')
    .select('codigo, alumno_nombre, capacitacion_nombre, fecha_emision, habilidades')
    .eq('codigo', codigo)
    .single()

  if (error || !data) {
    console.warn(`[Certificados] Código no verificado o inexistente: ${codigo}`)
    return <CertificadoViewer certificado={null} codigo={codigo} />
  }

  // Mapeamos los datos y los enviamos al componente interactivo del cliente
  const certificado: Certificado = {
    codigo: data.codigo,
    alumno_nombre: data.alumno_nombre,
    capacitacion_nombre: data.capacitacion_nombre,
    fecha_emision: data.fecha_emision,
    habilidades: data.habilidades || []
  }

  return <CertificadoViewer certificado={certificado} codigo={codigo} />
}
