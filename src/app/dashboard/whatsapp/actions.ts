'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

// ─── Tipos ──────────────────────────────────────────────────

export interface WhatsAppTemplate {
  id: string
  titulo: string
  cuerpo: string
  categoria: 'general' | 'evento' | 'socio' | 'sponsor' | 'medio'
  autor_id: string | null
  created_at: string
  updated_at: string
}

// ─── Queries ─────────────────────────────────────────────────

export async function getTemplatesAction(): Promise<WhatsAppTemplate[]> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .order('categoria')
    .order('titulo')

  if (error) {
    console.error('[whatsapp] getTemplatesAction error:', error.message)
    return []
  }

  return data ?? []
}

// ─── Mutations ───────────────────────────────────────────────

export async function saveTemplateAction(data: {
  id?: string
  titulo: string
  cuerpo: string
  categoria: WhatsAppTemplate['categoria']
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  if (data.id) {
    // UPDATE
    const { error } = await supabase
      .from('whatsapp_templates')
      .update({ titulo: data.titulo, cuerpo: data.cuerpo, categoria: data.categoria })
      .eq('id', data.id)

    if (error) {
      console.error('[whatsapp] saveTemplateAction update error:', error.message)
      return { success: false, error: error.message }
    }
  } else {
    // INSERT
    const { data: inserted, error } = await supabase
      .from('whatsapp_templates')
      .insert({ titulo: data.titulo, cuerpo: data.cuerpo, categoria: data.categoria, autor_id: member.id })
      .select('id')
      .single()

    if (error) {
      console.error('[whatsapp] saveTemplateAction insert error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/whatsapp')
    return { success: true, id: inserted.id }
  }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function deleteTemplateAction(id: string): Promise<{ success: boolean; error?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[whatsapp] deleteTemplateAction error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

/**
 * Registra en auditoría que se generó/abrió un link de WhatsApp.
 */
export async function logWhatsAppSendAction(data: {
  destinatario_numero: string
  destinatario_nombre?: string
  template_id?: string
  mensaje_enviado: string
}): Promise<{ success: boolean }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false }

  const supabase = await createClient()
  await supabase.from('whatsapp_logs').insert({
    destinatario_numero: data.destinatario_numero,
    destinatario_nombre: data.destinatario_nombre ?? null,
    template_id: data.template_id ?? null,
    mensaje_enviado: data.mensaje_enviado,
    enviado_por: member.id,
  })

  return { success: true }
}
