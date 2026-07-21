'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

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
      title: data.titulo,
      datos_crudos: data.datos_crudos,
      original_text: data.datos_crudos,
      summary: data.texto_publico?.slice(0, 500) || '',
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

  // 2. Guardar en tablas dedicadas por tipo de nota
  const newsFlashId = news.id

  if (data.para_publico && data.texto_publico) {
    const slug = data.titulo
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      + '-' + Date.now().toString().slice(-4)

    const { error: publicoError } = await supabase
      .from('notas_publico')
      .insert({
        news_flash_id: newsFlashId,
        titulo: data.titulo,
        contenido: data.texto_publico,
        autor_id: member.id,
        is_published: true,
        media_urls: data.media_urls || [],
        slug
      })
    if (publicoError) {
      console.error('[createMulticanalNewsAction] Error en notas_publico:', publicoError.message)
    }

    const { error: articleError } = await supabase
      .from('public_articles')
      .insert({
        title: data.titulo,
        content: data.texto_publico,
        media_urls: data.media_urls || [],
        author_id: member.id,
        is_published: true,
        slug: slug,
        excerpt: data.titulo
      })
    if (articleError) {
      console.error('[createMulticanalNewsAction] Error creando artículo:', articleError.message)
    }
  }

  if (data.para_miembros && data.texto_miembros) {
    const { error: miembrosError } = await supabase
      .from('notas_miembros')
      .insert({
        news_flash_id: newsFlashId,
        titulo: data.titulo,
        contenido: data.texto_miembros,
        autor_id: member.id,
        is_published: true,
        media_urls: data.media_urls || []
      })
    if (miembrosError) {
      console.error('[createMulticanalNewsAction] Error en notas_miembros:', miembrosError.message)
    }
  }

  if (data.para_sponsors && data.texto_sponsors) {
    const { error: sponsorsError } = await supabase
      .from('notas_sponsors')
      .insert({
        news_flash_id: newsFlashId,
        titulo: data.titulo,
        contenido: data.texto_sponsors,
        autor_id: member.id,
        is_published: true
      })
    if (sponsorsError) {
      console.error('[createMulticanalNewsAction] Error en notas_sponsors:', sponsorsError.message)
    }
  }

  if (data.para_medios && data.texto_medios) {
    const { error: mediosError } = await supabase
      .from('notas_medios')
      .insert({
        news_flash_id: newsFlashId,
        titulo: data.titulo,
        contenido: data.texto_medios,
        autor_id: member.id,
        is_published: true
      })
    if (mediosError) {
      console.error('[createMulticanalNewsAction] Error en notas_medios:', mediosError.message)
    }
  }

  revalidatePath('/dashboard/comunicacion')
  revalidatePath('/')
  revalidatePath('/acciones')
  return { success: true, data: news }
}
