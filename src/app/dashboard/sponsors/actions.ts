'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { generateSponsorReport } from '@/services/sponsorReport'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────
// CRUD: Acciones ITEC
// ─────────────────────────────────────────
export async function createAccionAction(data: {
  titulo: string
  descripcion: string
  categoria: string
  fecha: string
  presupuesto_total: number
  impacto_social: string
  trascendencia_regional: string
  rubros_relacionados: string[]
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('acciones_itec')
    .insert([data])
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sponsors')
  return { success: true, data: result }
}

export async function deleteAccionAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('acciones_itec').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true }
}

// ─────────────────────────────────────────
// CRUD: Reportes de Sponsors
// ─────────────────────────────────────────
export async function createReporteAction(data: {
  sponsor_id: string
  periodo: string
  acciones_ids: string[]
  fondo_comun_detalle: any
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()

  // 1. Obtener info completa de las acciones seleccionadas
  const { data: acciones } = await supabase
    .from('acciones_itec')
    .select('titulo, categoria, descripcion, impacto_social, trascendencia_regional, presupuesto_total, rubros_relacionados')
    .in('id', data.acciones_ids)

  // 2. Obtener datos del sponsor (nombre, rubro, métricas)
  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('name, rubro, impact_data')
    .eq('id', data.sponsor_id)
    .single()

  // 3. Identificar acciones que coinciden con el rubro del sponsor
  const accionesDestacadas = (sponsor?.rubro && acciones)
    ? acciones.filter((a: any) =>
        a.rubros_relacionados?.some((r: string) =>
          r.toLowerCase().includes(sponsor.rubro.toLowerCase())
        )
      )
    : []

  // 4. Calcular métricas totales del período
  const totalInversion = (acciones || []).reduce((sum: number, a: any) => sum + (a.presupuesto_total || 0), 0)

  // 5. Generar reporte con el Motor de Redacción de Impacto
  let ai_reporte: string | null = null

  if (acciones?.length && sponsor) {
    const reporteOutput = await generateSponsorReport({
      sponsor_nombre: sponsor.name,
      sponsor_rubro: sponsor.rubro || '',
      periodo: data.periodo,
      acciones: acciones.map((a: any) => ({
        titulo: a.titulo,
        categoria: a.categoria,
        descripcion: a.descripcion || '',
        impacto_social: a.impacto_social || '',
        trascendencia_regional: a.trascendencia_regional || '',
        presupuesto_total: a.presupuesto_total || 0,
      })),
      metricas: {
        total_alumnos: sponsor.impact_data?.alumnos || 0,
        total_horas: sponsor.impact_data?.horas || 0,
        total_inversion: totalInversion,
      },
      fondo_comun: data.fondo_comun_detalle,
      acciones_destacadas: accionesDestacadas.map((a: any) => ({
        titulo: a.titulo,
        categoria: a.categoria,
        descripcion: a.descripcion || '',
        impacto_social: a.impacto_social || '',
        trascendencia_regional: a.trascendencia_regional || '',
        presupuesto_total: a.presupuesto_total || 0,
      })),
    })

    ai_reporte = reporteOutput.texto_completo

    if (reporteOutput.error) {
      console.warn('[createReporte] IA usó fallback:', reporteOutput.error)
    }
  }

  // 6. Guardar el reporte en la base de datos
  const { data: result, error } = await supabase
    .from('sponsor_reportes')
    .insert([{ ...data, ai_reporte }])
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true, data: result }
}

export async function updateSponsorAction(id: string, formData: any) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('sponsors').update(formData).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true }
}

export async function createSponsorAction(formData: any) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data, error } = await supabase.from('sponsors').insert([formData]).select().single()
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true, data }
}

export async function deleteSponsorAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true }
}
