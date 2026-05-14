'use server'

import { videoService, CreateVideoData } from '@/services/videos'
import { revalidatePath } from 'next/cache'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'


/**
 * Acción para crear un video
 */
export async function createVideoAction(data: CreateVideoData) {
  try {
    const member = await getCurrentMember()
    if (!member || member.status !== 'activo' || !['admin', 'coordinador'].includes(member.role)) {
      return { success: false, error: 'No autorizado o cuenta inactiva' }
    }

    const supabase = await createClient()
    const video = await videoService.createVideo(data, supabase)
    revalidatePath('/dashboard/videoteca')
    revalidatePath('/')
    return { success: true, data: video }
  } catch (error: any) {
    console.error('Error in createVideoAction:', error)
    return { success: false, error: error.message || 'Error interno del servidor' }
  }
}

/**
 * Acción para actualizar un video (ej: activar/desactivar)
 */
export async function updateVideoAction(id: string, updates: any) {
  try {
    const member = await getCurrentMember()
    if (!member || member.status !== 'activo' || !['admin', 'coordinador'].includes(member.role)) {
      return { success: false, error: 'No autorizado o cuenta inactiva' }
    }

    const supabase = await createClient()
    const video = await videoService.updateVideo(id, updates, supabase)
    revalidatePath('/dashboard/videoteca')
    revalidatePath('/')
    return { success: true, data: video }
  } catch (error: any) {
    console.error('Error in updateVideoAction:', error)
    return { success: false, error: error.message || 'Error interno del servidor' }
  }
}

/**
 * Acción para eliminar un video
 */
export async function deleteVideoAction(id: string) {
  try {
    const member = await getCurrentMember()
    if (!member || member.status !== 'activo' || !['admin', 'coordinador'].includes(member.role)) {
      return { success: false, error: 'No autorizado o cuenta inactiva' }
    }

    const supabase = await createClient()
    await videoService.deleteVideo(id, supabase)
    revalidatePath('/dashboard/videoteca')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteVideoAction:', error)
    return { success: false, error: error.message || 'Error interno del servidor' }
  }
}




import { generateVideoSummary } from '@/services/ai'

/**
 * Acción para generar el resumen IA de un video
 */
export async function generateVideoSummaryAction(id: string, title: string, description: string) {
  try {
    const member = await getCurrentMember()
    if (!member || member.status !== 'activo' || !['admin', 'coordinador'].includes(member.role)) {
      return { success: false, error: 'No autorizado o cuenta inactiva' }
    }

    // 1. Generar resumen con AI
    const summary = await generateVideoSummary(title, description)

    // 2. Guardar en DB
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('videos')
      .update({ ai_summary: summary })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/videoteca')
    revalidatePath('/')
    
    return { success: true, summary: data.ai_summary }
  } catch (error: any) {
    console.error('Error in generateVideoSummaryAction:', error)
    return { success: false, error: error.message || 'Error interno del servidor' }
  }
}
