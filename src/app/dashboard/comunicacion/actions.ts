'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { generatePublicArticle } from '@/services/ai'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
 }) {
   const member = await getCurrentMember()
   if (!member || member.role !== 'admin') throw new Error('No autorizado')

   const supabase = await createClient()
   const { data: news, error } = await supabase
     .from('news_flashes')
     .insert({
       titulo: data.titulo,
       datos_crudos: data.datos_crudos,
       texto_publico: data.texto_publico,
       texto_miembros: data.texto_miembros,
       texto_sponsors: data.texto_sponsors,
       texto_medios: data.texto_medios,
       para_publico: data.para_publico,
       para_miembros: data.para_miembros,
       para_sponsors: data.para_sponsors,
       para_medios: data.para_medios,
       autor_id: member.id,
       is_published: true
     })
     .select()
     .single()

   if (error) {
     console.error('[createMulticanalNewsAction] Error:', error.message)
     return { success: false, error: error.message }
   }

   // Envío asincrónico de emails
   enviarEmailsAsincronos(news.id, data).catch(console.error)

   revalidatePath('/dashboard/comunicacion')
   return { success: true, data: news }
 }

async function enviarEmailsAsincronos(newsFlashId: string, textos: {
   titulo: string
   texto_medios: string
   texto_sponsors: string
}) {
   const supabase = await createClient()

   const { data: medios } = await supabase.from('medios_prensa').select('email, nombre_medio')
   if (medios?.length) {
     for (const medio of medios) {
       resend.emails.send({
         from: 'ITEC Saladillo <notificaciones@itec-saladillo.app>',
         to: medio.email,
         subject: `Gacetilla ITEC - ${medio.nombre_medio}`,
         html: `<pre style="font-family: monospace; white-space: pre-wrap;">${textos.texto_medios}</pre>`
       }).catch(console.error)
     }
   }

   const { data: sponsors } = await supabase.from('sponsors').select('id, nombre_empresa, email')
   if (sponsors?.length) {
     for (const sponsor of sponsors) {
       const link = `https://itec-saladillo.app/sponsors/${newsFlashId}?auth=${sponsor.id}`
       resend.emails.send({
         from: 'ITEC Saladillo <notificaciones@itec-saladillo.app>',
         to: sponsor.email,
         subject: `Reporte de Impacto - ${sponsor.nombre_empresa}`,
         html: `<p>Hola ${sponsor.nombre_empresa},</p><p>${textos.texto_sponsors}</p><p><a href="${link}">Ver reporte completo</a></p>`
       }).catch(console.error)
     }
   }
 }
