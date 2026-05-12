'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { generatePublicArticle } from '@/services/ai'
import { revalidatePath } from 'next/cache'

/**
 * Genera el borrador del artículo usando IA.
 */
export async function generateArticleDraftAction(rawFacts: string) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') throw new Error('No autorizado')

  if (!rawFacts.trim() || rawFacts.length < 10) {
    throw new Error('Por favor, ingresá más detalles sobre los hechos.')
  }

  try {
    const draft = await generatePublicArticle(rawFacts)
    return { success: true, draft }
  } catch (err: any) {
    console.error('[generateArticleDraftAction] Error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Persiste el artículo final en la base de datos.
 */
export async function publishArticleAction(formData: {
  id?: string
  title: string
  content: string
  media_urls: string[]
  is_published: boolean
}) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  
  const payload: any = {
    title: formData.title,
    content: formData.content,
    media_urls: formData.media_urls,
    is_published: formData.is_published,
    author_id: member.id,
    updated_at: new Date().toISOString()
  }

  // Generar slug solo si es nuevo
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
