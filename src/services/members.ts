import { createClient } from '@/lib/supabase/server'
import type { Member } from '@/types/database'

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[memberService] getMemberById error:', error.message)
    return null
  }
  return data
}

export async function getMembers(): Promise<Member[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'activo')
    .order('full_name')

  if (error) {
    console.error('[memberService] getMembers error:', error.message)
    return []
  }
  return data ?? []
}

export async function upsertMemberFromAuth(authUser: {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}): Promise<Member | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .upsert({
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.full_name ?? authUser.email.split('@')[0],
      avatar_url: authUser.avatar_url ?? null,
      role: 'miembro',
      status: 'pendiente',
    })
    .select()
    .single()

  if (error) {
    console.error('[memberService] upsertMember error:', error.message)
    return null
  }
  return data
}
