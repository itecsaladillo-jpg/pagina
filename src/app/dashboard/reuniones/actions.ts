'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { generateExecutiveSummary, generateActionItems } from '@/services/ai'
import { revalidatePath } from 'next/cache'

/**
 * Guarda o actualiza las notas activas de una sesión de reunión.
 */
export async function saveNotesAction(commissionId: string, content: string) {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') throw new Error('No autorizado')

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const id = commissionId === 'general' ? null : commissionId

  // Buscar si ya existe una nota activa de este día para esta comisión
  const query = supabase
    .from('meeting_notes')
    .select('id')
    .eq('session_date', today)
    .eq('is_active', true)
  
  if (id) {
    query.eq('commission_id', id)
  } else {
    query.is('commission_id', null)
  }

  const { data: existing } = await query.single()

  if (existing) {
    await supabase
      .from('meeting_notes')
      .update({ content, updated_by: member.id, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    return { success: true }
  }

  await supabase
    .from('meeting_notes')
    .insert([{ 
      commission_id: id, 
      content, 
      updated_by: member.id, 
      session_date: today 
    }])

  return { success: true }
}

/**
 * Finaliza la reunión: genera resumen con IA y lo publica en el Muro.
 */
export async function finalizeAndPublishAction(commissionId: string, content: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'Solo administradores o coordinadores pueden finalizar la reunión.' }
  }

  if (!content.trim() || content.length < 20) {
    return { success: false, error: 'Las notas están vacías o son demasiado breves para generar un resumen.' }
  }

  try {
    const supabase = await createClient()

    // 1. Generar resumen ejecutivo y action items con Gemini
    const [summary, actionItems] = await Promise.all([
      generateExecutiveSummary(content),
      generateActionItems(content),
    ])

    // 2. Obtener nombre de la comisión
    const { data: commission } = await supabase
      .from('commissions')
      .select('name')
      .eq('id', commissionId)
      .single()

    const commissionName = commissionId === 'general' ? 'General' : (commission?.name || 'Comisión')
    const sessionDate = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

    // 4. Publicar en el Muro de Noticias (alineado con tabla news_flashes)
    const { error: flashError } = await supabase
      .from('news_flashes')
      .insert([{
        title: `Resumen de Reunión — ${commissionName}`,
        original_text: content,
        summary: summary,
        action_items: actionItems.split('\n').filter(Boolean),
        flash_text: `📋 Se ha publicado la minuta de la Reunión ${commissionName} del ${sessionDate}.`,
        source_type: 'reunion',
        commission_id: commissionId === 'general' ? null : commissionId,
        author_id: member.id,
        is_published: true,
      }])

    if (flashError) {
      console.error('[finalize] Error publicando flash:', flashError.message)
      return { success: false, error: 'El resumen se generó pero no se pudo publicar en el Muro.' }
    }

    // 5. Marcar la nota como inactiva (sesión cerrada)
    const today = new Date().toISOString().split('T')[0]
    const closeQuery = supabase
      .from('meeting_notes')
      .update({ is_active: false })
      .eq('session_date', today)
    
    if (commissionId === 'general') {
      closeQuery.is('commission_id', null)
    } else {
      closeQuery.eq('commission_id', commissionId)
    }
    
    await closeQuery

    revalidatePath('/dashboard/muro')
    revalidatePath('/dashboard/reuniones')

    return { success: true, summary, actionItems }

  } catch (err: any) {
    console.error('[finalize] Error:', err)
    return { success: false, error: err.message || 'Error al procesar la reunión.' }
  }
}
