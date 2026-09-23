'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

// Schema de validación para socios estratégicos
const createPartnerSchema = z.object({
  name: z.string().min(1, 'Nombre de la institución requerido'),
  category: z.enum(['institucion_educativa', 'organismo_publico', 'ong', 'empresa_aliada', 'otro']).optional(),
  actions_description: z.string().min(10, 'La descripción de acciones debe tener al menos 10 caracteres'),
  logo_url: z.string().url('URL del logo inválida'),
})

const updatePartnerSchema = createPartnerSchema.partial()

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>

// ─────────────────────────────────────────
// CRUD: Socios Estratégicos
// ─────────────────────────────────────────

export async function createStrategicPartner(data: CreatePartnerInput) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = createPartnerSchema.parse(data)

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('strategic_partners')
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sponsors')
  return { success: true, data: result }
}

export async function updateStrategicPartner(id: string, data: UpdatePartnerInput) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = updatePartnerSchema.parse(data)

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('strategic_partners')
    .update(validated)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sponsors')
  return { success: true, data: result }
}

export async function deleteStrategicPartner(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('strategic_partners')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sponsors')
  return { success: true }
}

export async function getStrategicPartners() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('strategic_partners')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getStrategicPartnersAdmin() {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('strategic_partners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}