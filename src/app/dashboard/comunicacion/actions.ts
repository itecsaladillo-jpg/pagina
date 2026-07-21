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
  if (!member || !['admin', 'coordinador'].includes(member.role)) throw new Error('No autorizado')

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
        excerpt: data.titulo,
        news_flash_id: newsFlashId
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
        is_published: true,
        media_urls: data.media_urls || []
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
        is_published: true,
        media_urls: data.media_urls || []
      })
    if (mediosError) {
      console.error('[createMulticanalNewsAction] Error en notas_medios:', mediosError.message)
    }
  }

  revalidatePath('/dashboard/comunicacion')
  revalidatePath('/')
  revalidatePath('/acciones')
  revalidatePath('/muro')
  revalidatePath('/dashboard/muro')
  return { success: true, data: news }
}

export async function updateNotaAction(data: {
  newsFlashId: string
  variant: 'publico' | 'miembros' | 'sponsors' | 'medios'
  contenido: string
  media_urls?: string[]
}) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) throw new Error('No autorizado')

  const supabase = await createClient()

  const tableMap = {
    publico: 'notas_publico',
    miembros: 'notas_miembros',
    sponsors: 'notas_sponsors',
    medios: 'notas_medios',
  } as const

  // 1. Actualizar tabla por canal
  const table = tableMap[data.variant]
  const payload: any = { contenido: data.contenido }
  if (data.media_urls) {
    payload.media_urls = data.media_urls
  }

  const { error } = await supabase
    .from(table)
    .update(payload)
    .eq('news_flash_id', data.newsFlashId)

  if (error) {
    console.error(`[updateNotaAction] Error en ${table}:`, error.message)
    return { success: false, error: error.message }
  }

  // 2. Actualizar news_flashes (para que se vea en Comunicación Estratégica)
  const newsUpdate: any = {}
  if (data.media_urls) {
    newsUpdate.media_urls = data.media_urls
  }
  const textFieldMap = {
    publico: 'texto_publico',
    miembros: 'texto_miembros',
    sponsors: 'texto_sponsors',
    medios: 'texto_medios',
  } as const
  newsUpdate[textFieldMap[data.variant]] = data.contenido

  const { error: newsError } = await supabase
    .from('news_flashes')
    .update(newsUpdate)
    .eq('id', data.newsFlashId)

  if (newsError) {
    console.error('[updateNotaAction] Error en news_flashes:', newsError.message)
  }

  // 3. Actualizar public_articles si es la variante público
  if (data.variant === 'publico') {
    const { error: articleError } = await supabase
      .from('public_articles')
      .update({
        content: data.contenido,
        media_urls: data.media_urls || [],
      })
      .eq('news_flash_id', data.newsFlashId)

    if (articleError) {
      console.error('[updateNotaAction] Error en public_articles:', articleError.message)
    }
  }

  revalidatePath('/dashboard/comunicacion')
  revalidatePath('/acciones')
  revalidatePath('/muro')
  revalidatePath('/dashboard/muro')
  return { success: true }
}

export async function deleteNotaAction(newsFlashId: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) throw new Error('No autorizado')

  const supabase = await createClient()

  // Borrar de tablas secundarias primero
  const tables = ['public_articles', 'notas_publico', 'notas_miembros', 'notas_sponsors', 'notas_medios']
  for (const table of tables) {
    await supabase.from(table).delete().eq('news_flash_id', newsFlashId)
  }

  // Borrar de tabla principal
  const { error } = await supabase.from('news_flashes').delete().eq('id', newsFlashId)

  if (error) {
    console.error('[deleteNotaAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/comunicacion')
  revalidatePath('/acciones')
  revalidatePath('/muro')
  revalidatePath('/dashboard/muro')
  revalidatePath('/')
  return { success: true }
}

export async function swapNotasOrderAction(notaId1: string, notaId2: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) throw new Error('No autorizado')

  const supabase = await createClient()

  // Fetch both to get their created_at
  const { data: n1 } = await supabase.from('news_flashes').select('created_at').eq('id', notaId1).single()
  const { data: n2 } = await supabase.from('news_flashes').select('created_at').eq('id', notaId2).single()

  if (!n1 || !n2) return { success: false, error: 'Noticia no encontrada' }

  // Swap created_at in news_flashes
  await supabase.from('news_flashes').update({ created_at: n2.created_at }).eq('id', notaId1)
  await supabase.from('news_flashes').update({ created_at: n1.created_at }).eq('id', notaId2)

  // Swap in child tables too to maintain order across the app
  const tables = ['notas_publico', 'notas_miembros', 'notas_sponsors', 'notas_medios', 'public_articles']
  for (const table of tables) {
    await supabase.from(table).update({ created_at: n2.created_at }).eq('news_flash_id', notaId1)
    await supabase.from(table).update({ created_at: n1.created_at }).eq('news_flash_id', notaId2)
  }

  revalidatePath('/dashboard/comunicacion')
  revalidatePath('/acciones')
  revalidatePath('/muro')
  revalidatePath('/dashboard/muro')
  revalidatePath('/')
  return { success: true }
}
