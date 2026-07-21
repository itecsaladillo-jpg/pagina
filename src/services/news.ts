import { createClient } from '@/lib/supabase/server'

export interface NewsFlashMulticanal {
  id: string
  created_at: string
  updated_at: string
  autor_id: string | null
  titulo: string
  datos_crudos: string
  texto_publico: string
  texto_miembros: string
  texto_sponsors: string
  texto_medios: string
  is_published: boolean
  para_publico: boolean
  para_miembros: boolean
  para_sponsors: boolean
  para_medios: boolean
  source_type?: string
  commission_id?: string | null
  original_text?: string
  summary?: string
  action_items?: string[]
  flash_text?: string
}

export interface NewsFlash {
  id: string
  created_at: string
  updated_at: string
  commission_id: string | null
  author_id: string | null
  title: string
  original_text: string
  summary: string
  action_items: string[]
  flash_text: string
  source_type: 'meet' | 'capacitacion' | 'reunion' | 'manual'
  is_published: boolean
  titulo?: string
}

export interface NotaPublico {
  id: string
  created_at: string
  updated_at: string
  news_flash_id: string | null
  titulo: string
  contenido: string
  autor_id: string | null
  is_published: boolean
  media_urls: string[]
  slug: string
}

export interface NotaMiembro {
  id: string
  created_at: string
  updated_at: string
  news_flash_id: string | null
  titulo: string
  contenido: string
  autor_id: string | null
  is_published: boolean
  media_urls: string[]
}

export interface NotaSponsor {
  id: string
  created_at: string
  updated_at: string
  news_flash_id: string | null
  titulo: string
  contenido: string
  autor_id: string | null
  is_published: boolean
  sponsor_ids: string[]
}

export interface NotaMedio {
  id: string
  created_at: string
  updated_at: string
  news_flash_id: string | null
  titulo: string
  contenido: string
  autor_id: string | null
  is_published: boolean
  contacto_prensa: any
}

export interface RelatedVideo {
  id: string
  title: string
  youtube_url: string
}

export interface PublicArticle {
  id: string
  created_at: string
  updated_at: string
  title: string
  content: string
  media_urls: string[]
  author_id: string
  is_published: boolean
  slug: string
  excerpt: string | null
  related_video_id: string | null
  related_video?: RelatedVideo | null
}

export async function getPublicArticles(): Promise<PublicArticle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('public_articles')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getPublicArticles error:', error.message)
    return []
  }

  const articles = (data ?? []) as any[]

  // Intentar cargar la información del video de forma segura y tolerante a fallos
  try {
    const articlesWithVideoId = articles.filter(art => 'related_video_id' in art && art.related_video_id)
    if (articlesWithVideoId.length > 0) {
      const videoIds = articlesWithVideoId.map(art => art.related_video_id)
      const { data: videosData, error: videoError } = await supabase
        .from('videos')
        .select('id, title, youtube_url')
        .in('id', videoIds)
      
      if (!videoError && videosData && videosData.length > 0) {
        const videoMap = new Map(videosData.map(v => [v.id, v]))
        for (const art of articles) {
          if (art.related_video_id && videoMap.has(art.related_video_id)) {
            art.related_video = videoMap.get(art.related_video_id)
          }
        }
      }
    }
  } catch (e) {
    console.warn('[newsService] Fallback reading related videos failed (this is expected if migration 022 has not run yet):', e)
  }

  return articles as PublicArticle[]
}

export async function getAllArticles(): Promise<PublicArticle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('public_articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getAllArticles error:', error.message)
    return []
  }
  return (data ?? []) as PublicArticle[]
}

export async function getArticleBySlug(slug: string): Promise<PublicArticle | null> {
  const supabase = await createClient()
  
  // Validar si el slug es un UUID para evitar errores de sintaxis en Supabase
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  
  let query = supabase
    .from('public_articles')
    .select('*')
  
  if (isUUID) {
    query = query.or(`slug.eq.${slug},id.eq.${slug}`)
  } else {
    query = query.eq('slug', slug)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('[newsService] getArticleBySlug error:', error.message)
    return null
  }

  if (!data) return null
  const article = data as any

  // Intentar cargar la información del video de forma segura y tolerante a fallos
  try {
    if ('related_video_id' in article && article.related_video_id) {
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('id, title, youtube_url')
        .eq('id', article.related_video_id)
        .maybeSingle()
      
      if (!videoError && videoData) {
        article.related_video = videoData
      }
    }
  } catch (e) {
    console.warn('[newsService] Fallback reading related video failed (this is expected if migration 022 has not run yet):', e)
  }

  return article as PublicArticle
}

export async function getPublicNotas(): Promise<NotaPublico[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_publico')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getPublicNotas error:', error.message)
    return []
  }
  return (data ?? []) as NotaPublico[]
}

export async function getMemberNotas(): Promise<NotaMiembro[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_miembros')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getMemberNotas error:', error.message)
    return []
  }
  return (data ?? []) as NotaMiembro[]
}

export async function getSponsorNotas(): Promise<NotaSponsor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_sponsors')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getSponsorNotas error:', error.message)
    return []
  }
  return (data ?? []) as NotaSponsor[]
}

export async function getPressNotas(): Promise<NotaMedio[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_medios')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getPressNotas error:', error.message)
    return []
  }
  return (data ?? []) as NotaMedio[]
}

export async function getAllMulticanalNewsFlashes(): Promise<NewsFlashMulticanal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('news_flashes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getAllMulticanalNewsFlashes error:', error.message)
    return []
  }

  return (data ?? []).filter((f: any) =>
    f.titulo && (f.texto_publico || f.texto_miembros || f.texto_sponsors || f.texto_medios)
  ) as NewsFlashMulticanal[]
}

// Legacy: mantener funciones viejas para retrocompatibilidad
export async function getPublicNewsFlashes(): Promise<NewsFlashMulticanal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('news_flashes')
    .select('*')
    .eq('para_publico', true)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getPublicNewsFlashes error:', error.message)
    return []
  }
  return (data ?? []) as NewsFlashMulticanal[]
}

export async function getMemberNewsFlashes(): Promise<NewsFlashMulticanal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('news_flashes')
    .select('*')
    .eq('para_miembros', true)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getMemberNewsFlashes error:', error.message)
    return []
  }
  return (data ?? []) as NewsFlashMulticanal[]
}

export async function getSponsorNewsFlashes(): Promise<NewsFlashMulticanal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('news_flashes')
    .select('*')
    .eq('para_sponsors', true)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getSponsorNewsFlashes error:', error.message)
    return []
  }
  return (data ?? []) as NewsFlashMulticanal[]
}

export async function getPressNewsFlashes(): Promise<NewsFlashMulticanal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('news_flashes')
    .select('*')
    .eq('para_medios', true)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getPressNewsFlashes error:', error.message)
    return []
  }
  return (data ?? []) as NewsFlashMulticanal[]
}

export async function createMulticanalNewsFlash(
  flash: Omit<NewsFlashMulticanal, 'id' | 'created_at' | 'updated_at'>
): Promise<NewsFlashMulticanal | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('news_flashes')
    .insert({
      ...flash,
      original_text: '',
      summary: '',
      action_items: [],
      flash_text: '',
      source_type: 'manual'
    })
    .select()
    .single()

  if (error) {
    console.error('[newsService] createMulticanalNewsFlash error:', error.message)
    return null
  }
  return data as NewsFlashMulticanal
}
