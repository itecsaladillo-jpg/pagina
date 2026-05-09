import { createClient } from '@/lib/supabase/server'

export interface NewsFlash {
  id: string
  created_at: string
  updated_at: string
  commission_id: string | null
  author_id: string | null
  original_text: string
  summary: string
  action_items: string[]
  flash_text: string
  source_type: 'meet' | 'capacitacion' | 'reunion' | 'manual'
  title: string
  is_published: boolean
  tags: string[]
}

export async function getNewsFlashes(commissionId?: string): Promise<NewsFlash[]> {
  const supabase = await createClient()

  let query = supabase
    .from('news_flashes')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (commissionId) {
    query = query.or(`commission_id.eq.${commissionId},commission_id.is.null`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[newsService] getNewsFlashes error:', error.message)
    return []
  }
  return (data ?? []) as NewsFlash[]
}

export async function createNewsFlash(
  flash: Omit<NewsFlash, 'id' | 'created_at' | 'updated_at'>
): Promise<NewsFlash | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('news_flashes')
    .insert(flash)
    .select()
    .single()

  if (error) {
    console.error('[newsService] createNewsFlash error:', error.message)
    return null
  }
  return data as NewsFlash
}
