'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    throw new Error('No autorizado')
  }
  return member
}

export async function aprobarTestimonioAction(id: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase
      .from('saladillo_for_export')
      .update({ estado: 'aprobado' })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function rechazarTestimonioAction(id: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase
      .from('saladillo_for_export')
      .update({ estado: 'rechazado' })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function setEmbajadorAction(id: string, orden: number | null) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    if (orden !== null) {
      const { data: existing } = await supabase
        .from('saladillo_for_export')
        .select('id')
        .eq('es_embajador', true)
        .eq('orden_embajador', orden)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return { success: false, error: `La posición ${orden} ya está ocupada por otro embajador.` }
      }
    }

    const { error } = await supabase
      .from('saladillo_for_export')
      .update({
        es_embajador: orden !== null,
        orden_embajador: orden,
      })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function eliminarTestimonioAction(id: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase
      .from('saladillo_for_export')
      .delete()
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
