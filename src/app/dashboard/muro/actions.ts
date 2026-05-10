'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function deleteNewsFlashAction(id: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('news_flashes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteNewsFlashAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/muro')
  revalidatePath('/')
  return { success: true }
}
