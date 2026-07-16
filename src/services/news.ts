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
