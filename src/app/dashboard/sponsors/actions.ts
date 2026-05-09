'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function createSponsorAction(formData: {
  name: string
  ai_summary: string
  impact_data: any
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .insert([formData])
    .select()

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/sponsors')
  return { success: true, data: data[0] }
}

export async function updateSponsorAction(id: string, formData: any) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('sponsors')
    .update(formData)
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/sponsors')
  return { success: true }
}

export async function deleteSponsorAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('sponsors')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/sponsors')
  return { success: true }
}
