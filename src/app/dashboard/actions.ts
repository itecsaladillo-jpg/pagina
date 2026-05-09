'use server'

import { processWithAI, type AIProcessResult } from '@/services/ai'
import { createNewsFlash } from '@/services/news'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'

export interface ProcessTextResult {
  success: boolean
  data?: AIProcessResult & { id: string }
  error?: string
}

/**
 * Server Action: procesa un texto con Gemini y guarda el resultado en Supabase.
 */
export async function processTextAction(
  formData: FormData
): Promise<ProcessTextResult> {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') {
    redirect('/acceso-pendiente')
  }

  if (!['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No tenés permisos para generar contenido.' }
  }

  const title = formData.get('title') as string
  const text = formData.get('text') as string
  const sourceType = formData.get('sourceType') as 'meet' | 'capacitacion' | 'reunion' | 'manual'
  const commissionId = formData.get('commissionId') as string | null

  if (!title?.trim() || !text?.trim()) {
    return { success: false, error: 'El título y el texto son obligatorios.' }
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'TU_GEMINI_API_KEY_AQUI') {
    return { success: false, error: 'La API de Gemini no está configurada. Agregá GEMINI_API_KEY en tus variables de entorno.' }
  }

  let aiResult: AIProcessResult
  try {
    aiResult = await processWithAI(text, sourceType ?? 'manual')
  } catch (err) {
    console.error('[processTextAction] AI error:', err)
    return { success: false, error: 'Error al procesar el texto con IA. Verificá la API key.' }
  }

  const saved = await createNewsFlash({
    title,
    original_text: text,
    summary: aiResult.summary,
    action_items: aiResult.action_items,
    flash_text: aiResult.flash_text,
    source_type: sourceType ?? 'manual',
    commission_id: commissionId || null,
    author_id: member.id,
    is_published: true,
    tags: [],
  })

  if (!saved) {
    return { success: false, error: 'Error al guardar en la base de datos.' }
  }

  return {
    success: true,
    data: { ...aiResult, id: saved.id },
  }
}
