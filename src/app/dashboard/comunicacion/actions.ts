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
  title: string
  content: string
  media_urls: string[]
  is_published: boolean
}) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  
  // Generar slug simple
  const slug = formData.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    + '-' + Date.now().toString().slice(-4)

  const { data, error } = await supabase
    .from('public_articles')
    .insert([{
      ...formData,
      slug,
      author_id: member.id,
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('[publishArticleAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/comunicacion')
  revalidatePath('/') // Para que se vea en la home pública si existe
  return { success: true, data }
}
