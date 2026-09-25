'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ALLOWED_YEARS = [2022, 2023, 2024, 2025] as const

const CreateArchivoSchema = z.object({
  title: z.string().trim().min(3, 'El título del evento debe tener al menos 3 caracteres'),
  social_url: z.string().trim().url('El link a redes sociales debe ser una URL válida (ej: https://www.instagram.com/...)'),
  year: z.coerce.number().refine(
    (y): y is 2022 | 2023 | 2024 | 2025 => ALLOWED_YEARS.includes(y as any),
    { message: 'Es obligatorio seleccionar un año válido (2022, 2023, 2024 o 2025)' }
  ),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
})

export async function createArchivoAccionAction(formData: {
  title: string
  social_url: string
  year: number | string
  category?: string
  description?: string
}) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No tenés permisos para realizar esta acción.' }
  }

  const parseResult = CreateArchivoSchema.safeParse(formData)
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map(e => e.message).join('. ')
    return { success: false, error: errorMsg }
  }

  const { title, social_url, year, category, description } = parseResult.data

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('archivo_acciones')
      .insert({
        title,
        social_url,
        year,
        category: category?.trim() || 'General',
        description: description?.trim() || null,
        created_by: member.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[createArchivoAccionAction] Error Supabase:', error.message)
      return { success: false, error: `Error al guardar en base de datos: ${error.message}` }
    }

    revalidatePath('/dashboard/archivo')
    revalidatePath('/')

    return { success: true, data }
  } catch (err: any) {
    console.error('[createArchivoAccionAction] Exception:', err)
    return { success: false, error: err?.message || 'Error inesperado al guardar el evento.' }
  }
}

export async function deleteArchivoAccionAction(id: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No tenés permisos para realizar esta acción.' }
  }

  if (!id) {
    return { success: false, error: 'Identificador de evento inválido.' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('archivo_acciones')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteArchivoAccionAction] Error Supabase:', error.message)
      return { success: false, error: `Error al eliminar el evento: ${error.message}` }
    }

    revalidatePath('/dashboard/archivo')
    revalidatePath('/')

    return { success: true }
  } catch (err: any) {
    console.error('[deleteArchivoAccionAction] Exception:', err)
    return { success: false, error: err?.message || 'Error inesperado al eliminar el evento.' }
  }
}
