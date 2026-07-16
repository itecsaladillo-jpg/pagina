'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

/**
 * Persiste el artículo final en la base de datos.
 */
export async function publishArticleAction(formData: {
  id?: string
  title: string
  content: string
  media_urls: string[]
  is_published: boolean
  created_at?: string
  badge_text?: string
}) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  
  const payload: any = {
    title: formData.title,
    content: formData.content,
    media_urls: formData.media_urls,
    is_published: formData.is_published,
    excerpt: formData.badge_text,
    author_id: member.id,
    updated_at: new Date().toISOString()
  }

  if (formData.created_at) {
    payload.created_at = formData.created_at
  }

  if (!formData.id) {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      + '-' + Date.now().toString().slice(-4)
    payload.slug = slug
  }

  let query = supabase.from('public_articles')
  
  if (formData.id) {
    const { data, error } = await query
      .update(payload)
      .eq('id', formData.id)
      .select()
      .single()
    
    if (error) {
      console.error('[publishArticleAction] Update Error:', error.message)
      return { success: false, error: error.message }
    }
    revalidatePath('/dashboard/comunicacion')
    revalidatePath('/')
    return { success: true, data }
  } else {
    const { data, error } = await query
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('[publishArticleAction] Insert Error:', error.message)
      return { success: false, error: error.message }
    }
    revalidatePath('/dashboard/comunicacion')
    revalidatePath('/')
    return { success: true, data }
  }
}

export async function deleteArticleAction(id: string) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('public_articles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteArticleAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/comunicacion')
  revalidatePath('/')
  return { success: true }
}

export async function createMulticanalNewsAction(data: {
  titulo: string
  datos_crudos: string
  texto_publico: string
  texto_miembros: string
  texto_sponsors: string
  texto_medios: string
  para_publico: boolean
  para_miembros: boolean
  para_sponsors: boolean
  para_medios: boolean
  media_urls?: string[]
}) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  
  // 1. Guardar en news_flashes
  const { data: news, error } = await supabase
    .from('news_flashes')
    .insert({
      titulo: data.titulo,
      datos_crudos: data.datos_crudos,
      texto_publico: data.texto_publico,
      texto_miembros: data.texto_miembros,
      texto_sponsors: data.texto_sponsors,
      texto_medios: data.texto_medios,
      flash_text: `📋 ${data.titulo}. ${data.texto_publico?.slice(0, 100) || ''}...`,
      para_publico: data.para_publico,
      para_miembros: data.para_miembros,
      para_sponsors: data.para_sponsors,
      para_medios: data.para_medios,
      media_urls: data.media_urls || [],
      autor_id: member.id,
      is_published: true
    })
    .select()
    .single()

  if (error) {
    console.error('[createMulticanalNewsAction] Error en Supabase:', error.message)
    return { success: false, error: 'Fallo en base de datos: ' + error.message }
  }

  // 2. Guardar en public_articles para el muro de acciones
  const slug = data.titulo
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    + '-' + Date.now().toString().slice(-4)
  
  const { error: articleError } = await supabase
    .from('public_articles')
    .insert({
      title: data.titulo,
      content: data.texto_publico,
      media_urls: data.media_urls || [],
      author_id: member.id,
      is_published: true,
      slug: slug,
      excerpt: 'Noticia Multicanal'
    })

  if (articleError) {
    console.error('[createMulticanalNewsAction] Error creando artículo:', articleError.message)
    // No retornamos error para no bloquear la publicación del news flash
  }

  revalidatePath('/dashboard/comunicacion')
  revalidatePath('/')
  revalidatePath('/acciones')
  return { success: true, data: news }
}
