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
  media_urls?: string[]
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
  media_urls: string[]
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
  media_urls: string[]
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
    .select('*, news_flashes(media_urls)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getPublicArticles error:', error.message)
    return []
  }

  const articles = (data ?? []).map((art: any) => {
    // Resolver media_urls con fallback a news_flashes
    const media = art.media_urls
    let mediaArr = Array.isArray(media) ? media : (typeof media === 'string' ? (() => { try { return JSON.parse(media) } catch { return [] } })() : [])
    if (mediaArr.length === 0 && art.news_flashes) {
      const nfMedia = art.news_flashes.media_urls
      mediaArr = Array.isArray(nfMedia) ? nfMedia : (typeof nfMedia === 'string' ? (() => { try { return JSON.parse(nfMedia) } catch { return [] } })() : [])
    }
    art.media_urls = mediaArr
    return art
  })

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
    .select('*, news_flashes(media_urls)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getAllArticles error:', error.message)
    return []
  }
  return (data ?? []).map((art: any) => {
    const media = art.media_urls
    let mediaArr = Array.isArray(media) ? media : (typeof media === 'string' ? (() => { try { return JSON.parse(media) } catch { return [] } })() : [])
    if (mediaArr.length === 0 && art.news_flashes) {
      const nfMedia = art.news_flashes.media_urls
      mediaArr = Array.isArray(nfMedia) ? nfMedia : (typeof nfMedia === 'string' ? (() => { try { return JSON.parse(nfMedia) } catch { return [] } })() : [])
    }
    art.media_urls = mediaArr
    return art as PublicArticle
  })
}

export async function getArticleBySlug(slug: string): Promise<PublicArticle | null> {
  const supabase = await createClient()
  
  // Validar si el slug es un UUID para evitar errores de sintaxis en Supabase
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  
  let query = supabase
    .from('public_articles')
    .select('*, news_flashes(media_urls)')
  
  if (isUUID) {
    query = query.or(`slug.eq.${slug},id.eq.${slug}`)
  } else {
    query = query.eq('slug', slug)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('[newsService] getArticleBySlug error:', error.message)
  }

  let article = data as any

  // Si no se encuentra en public_articles y es un UUID (como los generados por Noticia Multicanal)
  if (!article && isUUID) {
    // Buscar en notas_publico
    const { data: notaData } = await supabase
      .from('notas_publico')
      .select('*, news_flashes(media_urls)')
      .eq('news_flash_id', slug)
      .eq('is_published', true)
      .maybeSingle()
      
    if (notaData) {
      article = {
        id: notaData.news_flash_id,
        title: notaData.titulo,
        content: notaData.contenido,
        excerpt: 'NOTICIA',
        created_at: notaData.created_at,
        media_urls: notaData.media_urls?.length ? notaData.media_urls : notaData.news_flashes?.media_urls || [],
        news_flashes: notaData.news_flashes
      }
    } else {
      // Intentar buscar directamente en news_flashes
      const { data: flashData } = await supabase
        .from('news_flashes')
        .select('*')
        .eq('id', slug)
        .maybeSingle()
        
      if (flashData && (flashData.para_publico || flashData.texto_publico)) {
        article = {
          id: flashData.id,
          title: flashData.titulo || flashData.title,
          content: flashData.texto_publico || flashData.flash_text || '',
          excerpt: flashData.summary || 'NOTICIA',
          created_at: flashData.created_at,
          media_urls: flashData.media_urls || []
        }
      }
    }
  }

  if (!article) return null

  // Resolver media_urls con fallback a news_flashes
  const media = article.media_urls
  let mediaArr = Array.isArray(media) ? media : (typeof media === 'string' ? (() => { try { return JSON.parse(media) } catch { return [] } })() : [])
  if (mediaArr.length === 0 && article.news_flashes) {
    const nfMedia = article.news_flashes.media_urls
    mediaArr = Array.isArray(nfMedia) ? nfMedia : (typeof nfMedia === 'string' ? (() => { try { return JSON.parse(nfMedia) } catch { return [] } })() : [])
  }
  article.media_urls = mediaArr

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
  
  // 1. Obtener de news_flashes (sujeto a RLS)
  const { data: flashesData, error } = await supabase
    .from('news_flashes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[newsService] getAllMulticanalNewsFlashes error:', error.message)
  }

  const flashesMap = new Map<string, any>((flashesData || []).map((f: any) => [f.id, f]))

  // 2. Obtener de notas_publico (acceso público irrestricto si is_published=true)
  const { data: notasPublico } = await supabase
    .from('notas_publico')
    .select('*, news_flashes(media_urls)')
    .eq('is_published', true)

  if (notasPublico) {
    for (const np of notasPublico) {
      if (np.news_flash_id) {
        const existing = flashesMap.get(np.news_flash_id)
        if (existing) {
          existing.texto_publico = np.contenido
          existing.para_publico = true
          if (np.media_urls && np.media_urls.length > 0) existing.media_urls = np.media_urls
        } else {
          flashesMap.set(np.news_flash_id, {
            id: np.news_flash_id,
            titulo: np.titulo,
            texto_publico: np.contenido,
            para_publico: true,
            is_published: true,
            created_at: np.created_at,
            media_urls: np.media_urls?.length ? np.media_urls : np.news_flashes?.media_urls || []
          })
        }
      }
    }
  }

  // 3. Obtener de notas_miembros (siempre expuesto para el equipo ITEC en el muro)
  const { data: notasMiembros } = await supabase
    .from('notas_miembros')
    .select('*, news_flashes(media_urls)')
    .eq('is_published', true)
    
  if (notasMiembros) {
    for (const nm of notasMiembros) {
      if (nm.news_flash_id) {
        const existing = flashesMap.get(nm.news_flash_id)
        if (existing) {
          existing.texto_miembros = nm.contenido
          existing.para_miembros = true
        } else {
          flashesMap.set(nm.news_flash_id, {
            id: nm.news_flash_id,
            titulo: nm.titulo,
            texto_miembros: nm.contenido,
            para_miembros: true,
            is_published: true,
            created_at: nm.created_at,
            media_urls: nm.media_urls?.length ? nm.media_urls : nm.news_flashes?.media_urls || []
          })
        }
      }
    }
  }

  const merged = Array.from(flashesMap.values())

  const result = merged
    .map((f: any) => {
      // Normalizar campos legacy
      if (!f.titulo && f.title) f.titulo = f.title
      if (!f.texto_publico && f.flash_text) f.texto_publico = f.flash_text
      
      const hasPublicText = Boolean(f.texto_publico && typeof f.texto_publico === 'string' && f.texto_publico.trim().length > 0)
      
      // Si tiene texto público o es noticia antigua, forzar para_publico en true
      if (f.para_publico === undefined || f.para_publico === null || hasPublicText) {
        f.para_publico = f.para_publico !== false
      }

      const hasMemberText = Boolean(f.texto_miembros && typeof f.texto_miembros === 'string' && f.texto_miembros.trim().length > 0)
      if (hasMemberText && (f.para_miembros === undefined || f.para_miembros === null)) {
        f.para_miembros = true
      }
      
      return f
    })
    .filter((f: any) =>
      f.titulo && (f.texto_publico || f.texto_miembros || f.texto_sponsors || f.texto_medios || f.flash_text)
    ) as NewsFlashMulticanal[]

  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return result
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
