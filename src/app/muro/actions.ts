'use server'

import { createClient } from '@/lib/supabase/server'

export async function handleComment(flashId: string, content: string): Promise<void> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { data: member } = await supabase
    .from('members')
    .select('id, name, email')
    .eq('id', user.id)
    .single()

  if (!member) throw new Error('Miembro no encontrado')

  const { error } = await supabase.from('news_comments').insert({
    news_flash_id: flashId,
    member_id: member.id,
    member_name: member.name,
    member_email: member.email,
    content,
  })

  if (error) throw new Error(error.message)
}

export async function handleLoadComments(flashId: string): Promise<any[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('news_comments')
    .select('id, created_at, member_name, content')
    .eq('news_flash_id', flashId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}
