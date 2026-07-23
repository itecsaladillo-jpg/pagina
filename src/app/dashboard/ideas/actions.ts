'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function createIdeaAction(formData: FormData) {
  const supabase = await createClient()

  const idea_text = formData.get('idea_text')?.toString().trim()
  if (!idea_text || idea_text.length < 10) {
    return { success: false, error: 'La idea debe tener al menos 10 caracteres.' }
  }

  const is_anonymous = formData.get('is_anonymous') === 'true'
  const author_name = formData.get('author_name')?.toString().trim() || null
  const author_email = formData.get('author_email')?.toString().trim() || null
  const author_phone = formData.get('author_phone')?.toString().trim() || null

  const { error } = await supabase.from('ideas').insert({
    idea_text,
    is_anonymous,
    author_name: is_anonymous ? null : author_name,
    author_email: is_anonymous ? null : author_email,
    author_phone: is_anonymous ? null : author_phone,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateIdeaStatusAction(id: string, status: string) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase.from('ideas').update({ status }).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/ideas')
  return { success: true }
}

export async function deleteIdeaAction(id: string) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase.from('ideas').delete().eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/ideas')
  return { success: true }
}
