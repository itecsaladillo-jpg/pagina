'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

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