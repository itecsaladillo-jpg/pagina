'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { generatePrensaEmailHtml } from '@/lib/email-templates/prensa'

const medioSchema = z.object({
  nombre_medio: z.string().min(1, 'Nombre del medio requerido'),
  tipo_medio: z.enum(['Radio', 'Diario Papel', 'Portal Web', 'TV']),
  url_web: z.string().url('URL inválida').optional().or(z.literal('')),
  dial_radio: z.string().optional(),
  zona_influencia: z.string().optional(),
  nombre_contacto: z.string().min(1, 'Nombre contacto requerido'),
  apellido_contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
})

export async function createMedioAction(data: z.infer<typeof medioSchema>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('medios_prensa')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/prensa')
  revalidatePath('/dashboard/prensaNews')
  return { success: true, data: result }
}

export async function updateMedioAction(id: string, data: Partial<z.infer<typeof medioSchema>>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('medios_prensa')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/prensa')
  revalidatePath('/dashboard/prensaNews')
  return { success: true }
}

export async function deleteMedioAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('medios_prensa').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/prensa')
  return { success: true }
}

export interface SendGacetillaPayload {
  newsFlashId: string
  selectedMediosIds: string[]
}

export async function sendGacetillaToMedios(payload: SendGacetillaPayload) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { data: nota, error: notaError } = await supabase
    .from('notas_medios')
    .select('id, news_flash_id, titulo, contenido, media_urls, created_at')
    .eq('id', payload.newsFlashId)
    .single()

  if (notaError || !nota) {
    return { success: false, error: 'Gacetilla no encontrada' }
  }

  const { data: medios, error: mediosError } = await supabase
    .from('medios_prensa')
    .select('id, nombre_medio, email')
    .in('id', payload.selectedMediosIds)

  if (mediosError || !medios || medios.length === 0) {
    return { success: false, error: 'No se encontraron medios seleccionados' }
  }

  const fecha = new Date(nota.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const html = generatePrensaEmailHtml({
    titulo: nota.titulo || '',
    contenidoMedios: nota.contenido || '',
    mediaUrls: Array.isArray(nota.media_urls) ? nota.media_urls : [],
    fecha,
  })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_123456789...') {
    console.warn('[sendGacetillaToMedios] RESEND_API_KEY no configurada. Simulando envíos.')
  }

  const resend = apiKey && apiKey !== 're_123456789...' ? new Resend(apiKey) : null

  const results: { medioId: string; medioNombre: string; email: string; status: 'enviado' | 'fallido'; error?: string }[] = []

  for (const medio of medios) {
    let status: 'enviado' | 'fallido' = 'fallido'
    let errorMessage: string | null = null

    if (resend) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: 'ITEC Saladillo <prensa@resend.dev>',
          to: [medio.email],
          subject: `Gacetilla de Prensa — ${nota.titulo || 'Comunicado ITEC'}`,
          html,
        })
        if (sendError) {
          errorMessage = sendError.message
        } else {
          status = 'enviado'
        }
      } catch (err: any) {
        errorMessage = err.message || 'Error desconocido al enviar'
      }
    } else {
      console.log(`[SIMULACIÓN] Enviando gacetilla a ${medio.nombre_medio} <${medio.email}>`)
      status = 'enviado'
    }

    const { error: logError } = await supabase.from('prensa_envios_log').insert({
      news_flash_id: nota.news_flash_id,
      medio_id: medio.id,
      medio_nombre: medio.nombre_medio,
      recipient_email: medio.email,
      status,
      error_message: errorMessage,
      sent_by_member_id: member.id,
    })

    if (logError) {
      console.error('[sendGacetillaToMedios] Error al registrar log:', logError.message)
    }

    results.push({
      medioId: medio.id,
      medioNombre: medio.nombre_medio,
      email: medio.email,
      status,
      error: errorMessage || undefined,
    })
  }

  const exitosos = results.filter(r => r.status === 'enviado').length
  const fallidos = results.filter(r => r.status === 'fallido').length

  revalidatePath('/dashboard/prensaNews')
  revalidatePath('/dashboard/prensa')

  return {
    success: fallidos === 0,
    enviados: exitosos,
    fallidos,
    results,
  }
}

export async function getActiveMediosPrensa() {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return []
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('medios_prensa')
    .select('id, nombre_medio, tipo_medio, email, nombre_contacto, apellido_contacto')
    .order('nombre_medio', { ascending: true })

  return data || []
}

export async function getGacetillaEnviosHistory(notaMediosId: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return []
  }

  const supabase = await createClient()

  const { data: nota } = await supabase
    .from('notas_medios')
    .select('news_flash_id')
    .eq('id', notaMediosId)
    .single()

  if (!nota?.news_flash_id) return []

  const { data } = await supabase
    .from('prensa_envios_log')
    .select('*')
    .eq('news_flash_id', nota.news_flash_id)
    .order('created_at', { ascending: false })

  return data || []
}