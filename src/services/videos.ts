import { createClient } from '@/lib/supabase/client'

export interface Video {
  id: string
  created_at: string
  title: string
  description: string | null
  ai_summary: string | null
  youtube_url: string
  thumbnail_url: string | null
  display_order: number
  is_active: boolean
}

export interface CreateVideoData {
  title: string
  description?: string
  ai_summary?: string
  youtube_url: string
  display_order?: number
}


/**
 * Extrae el ID de un video de YouTube a partir de su URL (soporta shorts, mobile, watch, etc)
 */
export function getYouTubeID(url: string): string | null {
  if (!url) return null
  
  // Patrón más robusto para capturar IDs de 11 caracteres en diversos formatos
  const patterns = [
    /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,
    /(?:embed\/|v\/|shorts\/|watch\?v=|youtu\.be\/)([0-9A-Za-z_-]{11})/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }

  return null
}


/**
 * Genera la URL de la miniatura de YouTube
 */
export function getYouTubeThumbnail(url: string): string {
  const id = getYouTubeID(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ''
}

export const videoService = {
  /**
   * Obtiene todos los videos activos para la sección pública
   */
  async getPublicVideos(supabaseClient?: any): Promise<Video[]> {
    const supabase = supabaseClient || createClient()
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Obtiene todos los videos para el panel de administración
   */
  async getAllVideos(supabaseClient?: any): Promise<Video[]> {
    const supabase = supabaseClient || createClient()
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Crea un nuevo video
   */
  async createVideo(video: CreateVideoData, supabaseClient?: any): Promise<Video> {
    const supabase = supabaseClient || createClient()
    const thumbnail_url = getYouTubeThumbnail(video.youtube_url)
    
    const { data, error } = await supabase
      .from('videos')
      .insert([{ ...video, thumbnail_url }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Actualiza un video existente
   */
  async updateVideo(id: string, updates: Partial<CreateVideoData & { is_active: boolean }>, supabaseClient?: any): Promise<Video> {
    const supabase = supabaseClient || createClient()
    
    const payload: any = { ...updates }
    if (updates.youtube_url) {
      payload.thumbnail_url = getYouTubeThumbnail(updates.youtube_url)
    }

    const { data, error } = await supabase
      .from('videos')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Elimina un video
   */
  async deleteVideo(id: string, supabaseClient?: any): Promise<void> {
    const supabase = supabaseClient || createClient()
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}



