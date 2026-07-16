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
 * Finaliza la reunión: guarda el resumen y cierra la sesión.
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

    // 2. Marcar la nota como inactiva y guardar el resumen
    const today = new Date().toISOString().split('T')[0]
    const updateQuery = supabase
      .from('meeting_notes')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString(),
        summary: summary,
        action_items: actionItems.split('\n').filter(Boolean)
      })
      .eq('session_date', today)
    
    if (commissionId === 'general') {
      await updateQuery.is('commission_id', null)
    } else {
      await updateQuery.eq('commission_id', commissionId)
    }

    revalidatePath('/dashboard/reuniones')

    return { success: true, summary, actionItems }

  } catch (err: any) {
    console.error('[finalize] Error:', err)
    return { success: false, error: err.message || 'Error al procesar la reunión.' }
  }
}
