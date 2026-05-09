import { createClient } from '@/lib/supabase/server'
import type { Idea } from '@/types/database'

export async function getIdeas(): Promise<Idea[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[ideaService] getIdeas error:', error.message)
    return []
  }
  return data ?? []
}

export async function submitIdea(
  idea: Omit<Idea, 'id' | 'created_at' | 'updated_at' | 'upvotes' | 'status'>
): Promise<Idea | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ideas')
    .insert({
      ...idea,
      status: 'nueva',
    })
    .select()
    .single()

  if (error) {
    console.error('[ideaService] submitIdea error:', error.message)
    return null
  }
  return data
}

export async function upvoteIdea(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('increment_upvotes', { idea_id: id })

  if (error) {
    console.error('[ideaService] upvoteIdea error:', error.message)
    return false
  }
  return true
}
