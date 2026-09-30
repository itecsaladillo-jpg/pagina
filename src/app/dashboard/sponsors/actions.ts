'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { generateSponsorReport } from '@/services/sponsorReport'
import { revalidatePath } from 'next/cache'
import type { Sponsor, SponsorReport } from '@/types/database'

type UpdateSponsorData = Partial<Omit<Sponsor, 'id' | 'created_at' | 'private_token'>>

interface FondoComunDetalle {
  viaticos: number
  hoteleria: number
  insumos: number
  otros: number
}

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
  revalidatePath('/dashboard/sponsorsNews')
  return { success: true, data: result }
}

export async function deleteAccionAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('acciones_itec').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  revalidatePath('/dashboard/sponsorsNews')
  return { success: true }
}

// ─────────────────────────────────────────
// CRUD: Reportes de Sponsors
// ─────────────────────────────────────────
export async function createReporteAction(data: {
  sponsor_id: string
  periodo: string
  acciones_ids: string[]
  fondo_comun_detalle: FondoComunDetalle
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()

  // 1. Obtener info completa de las acciones seleccionadas
  const { data: acciones } = await supabase
    .from('acciones_itec')
    .select('titulo, categoria, descripcion, impacto_social, trascendencia_regional, presupuesto_total, rubros_relacionados')
    .in('id', data.acciones_ids)

  // 2. Obtener datos del sponsor (nombre, actividad, métricas)
  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('name, actividad, impact_data')
    .eq('id', data.sponsor_id)
    .single()

  // 3. Identificar acciones que coinciden con el rubro del sponsor
  const accionesDestacadas = (sponsor?.actividad && acciones)
    ? acciones.filter((a: any) =>
        a.rubros_relacionados?.some((r: string) =>
          r.toLowerCase().includes((sponsor.actividad || '').toLowerCase())
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
      sponsor_rubro: sponsor.actividad || '',
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
  revalidatePath('/dashboard/sponsorsNews')
  return { success: true, data: result }
}

export async function updateSponsorAction(id: string, formData: UpdateSponsorData) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .update(formData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  revalidatePath('/dashboard/sponsorsNews')
  return { success: true, data }
}

export async function createSponsorAction(formData: {
  name: string
  tier: string
  rubro?: string | null
  resena?: string | null
  website_url?: string | null
  contacto_nombre?: string | null
  contacto_telefono?: string | null
  email?: string | null
  logo_monocromo_url?: string | null
  logo_color_url?: string | null
  is_active?: boolean
  description?: string | null
  // Columnas legacy (migración 036) — para consistencia con la ficha del admin
  nombre_empresa?: string
  actividad?: string | null
  zona_influencia?: string | null
  nombre_contacto?: string | null
  apellido_contacto?: string | null
  telefono?: string | null
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data, error } = await supabase.from('sponsors').insert([formData]).select().single()
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  revalidatePath('/dashboard/sponsorsNews')
  return { success: true, data }
}

export async function deleteSponsorAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  revalidatePath('/dashboard/sponsorsNews')
  return { success: true }
}

export interface ImportedSponsorItem {
  nombre_empresa: string
  actividad?: string | null
  website_url?: string | null
  telefono?: string | null
  email?: string | null
  zona_influencia?: string | null
}

export async function importSponsorsAction(items: ImportedSponsorItem[]) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') {
    return { success: false, error: 'No autorizado para realizar importaciones.' }
  }

  if (!items || items.length === 0) {
    return { success: false, error: 'No se enviaron datos para importar.' }
  }

  const supabase = await createClient()

  // 1. Obtener todos los sponsors existentes
  const { data: existingSponsors, error: fetchErr } = await supabase
    .from('sponsors')
    .select('*')

  if (fetchErr) {
    return { success: false, error: `Error al leer sponsors existentes: ${fetchErr.message}` }
  }

  const normalize = (str?: string | null) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim()

  const formatUrl = (url?: string | null) => {
    if (!url) return null
    const trimmed = url.trim()
    if (!trimmed || trimmed === '-') return null
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`
    }
    return trimmed
  }

  const formatEmail = (email?: string | null) => {
    if (!email) return null
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || trimmed === '-' || !trimmed.includes('@')) return null
    return trimmed
  }

  let createdCount = 0
  let updatedCount = 0
  const errorsList: string[] = []

  for (const item of items) {
    const rawName = item.nombre_empresa?.trim()
    if (!rawName) continue

    const normName = normalize(rawName)
    const cleanEmail = formatEmail(item.email)
    const cleanUrl = formatUrl(item.website_url)
    const cleanPhone = item.telefono?.trim() && item.telefono !== '-' ? item.telefono.trim() : null
    const cleanActividad = item.actividad?.trim() && item.actividad !== '-' ? item.actividad.trim() : null
    const cleanZona = item.zona_influencia?.trim() && item.zona_influencia !== '-' ? item.zona_influencia.trim() : null

    // Buscar si ya existe por nombre o por email
    const match = (existingSponsors || []).find(s => {
      const matchName = normalize(s.nombre_empresa || s.name) === normName
      const matchEmail = cleanEmail && s.email && formatEmail(s.email) === cleanEmail
      return matchName || matchEmail
    })

    if (match) {
      // ─── SOBREESCRIBIR CAMPOS EXISTENTES CON LOS DATOS DE LA PLANILLA ───
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }

      if (rawName) {
        updatePayload.name = rawName
        updatePayload.nombre_empresa = rawName
      }
      if (cleanActividad !== undefined) {
        updatePayload.actividad = cleanActividad
        updatePayload.rubro = cleanActividad
      }
      if (cleanUrl !== undefined) {
        updatePayload.website_url = cleanUrl
      }
      if (cleanPhone !== undefined) {
        updatePayload.telefono = cleanPhone
        updatePayload.contacto_telefono = cleanPhone
      }
      if (cleanEmail !== undefined) {
        updatePayload.email = cleanEmail
        updatePayload.contact_email = cleanEmail
      }
      if (cleanZona !== undefined) {
        updatePayload.zona_influencia = cleanZona
      }

      const { error: updateErr } = await supabase
        .from('sponsors')
        .update(updatePayload)
        .eq('id', match.id)

      if (updateErr) {
        errorsList.push(`Error al actualizar "${rawName}": ${updateErr.message}`)
      } else {
        updatedCount++
      }
    } else {
      // ─── CREAR NUEVO SPONSOR (campos no incluidos quedan vacíos) ───
      const insertPayload = {
        name: rawName,
        nombre_empresa: rawName,
        tier: 'standard',
        actividad: cleanActividad,
        rubro: cleanActividad,
        zona_influencia: cleanZona,
        telefono: cleanPhone,
        contacto_telefono: cleanPhone,
        email: cleanEmail,
        contact_email: cleanEmail,
        website_url: cleanUrl,
        is_active: true,
        nombre_contacto: null, // Queda vacío para su relleno manual
        apellido_contacto: null, // Queda vacío para su relleno manual
        contacto_nombre: null,
        resena: null,
        description: null,
        logo_monocromo_url: null,
        logo_color_url: null,
      }

      const { error: insertErr } = await supabase
        .from('sponsors')
        .insert([insertPayload])

      if (insertErr) {
        errorsList.push(`Error al crear "${rawName}": ${insertErr.message}`)
      } else {
        createdCount++
      }
    }
  }

  // Obtener lista final actualizada de sponsors
  const { data: refreshedSponsors } = await supabase
    .from('sponsors')
    .select('*')
    .order('created_at', { ascending: false })

  revalidatePath('/dashboard/sponsors')
  revalidatePath('/dashboard/sponsorsNews')
  revalidatePath('/')

  return {
    success: true,
    createdCount,
    updatedCount,
    totalProcessed: createdCount + updatedCount,
    errors: errorsList,
    sponsors: refreshedSponsors || []
  }
}

