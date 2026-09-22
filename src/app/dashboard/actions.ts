'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { processWithAI, generateFlash } from '@/services/ai'

export interface ProcessTextResult {
  success: boolean
  data?: {
    flash_text: string
    summary: string
    action_items: string[]
  }
  error?: string
}

export async function processTextAction(formData: FormData): Promise<ProcessTextResult> {
  const title = formData.get('title') as string
  const sourceType = formData.get('sourceType') as 'meet' | 'capacitacion' | 'reunion' | 'manual'
  const commissionId = formData.get('commissionId') as string
  const text = formData.get('text') as string

  if (!text) {
    return { success: false, error: 'El texto es requerido' }
  }

  try {
    const member = await getCurrentMember()
    if (!member || member.role !== 'admin') {
      return { success: false, error: 'No autorizado' }
    }

    let commissionName: string | undefined
    if (commissionId) {
      const supabase = await createClient()
      const { data: commission } = await supabase
        .from('commissions')
        .select('name')
        .eq('id', commissionId)
        .single()
      commissionName = commission?.name
    }

    const aiResult = await processWithAI(text, sourceType, commissionName)
    const flashText = await generateFlash(text)

    const supabase = await createClient()
    const { error: insertError } = await supabase.from('news_flashes').insert({
      titulo: title,
      datos_crudos: text,
      texto_publico: 'Contenido procesado por IA',
      texto_miembros: 'Contenido procesado por IA',
      texto_sponsors: 'Contenido procesado por IA',
      texto_medios: 'Contenido procesado por IA',
      flash_text: flashText,
      para_publico: true,
      para_miembros: true,
      para_sponsors: true,
      para_medios: true,
      autor_id: member.id,
      is_published: true
    })

    if (insertError) {
      console.error('[processTextAction] Error inserting flash:', insertError)
    }

    revalidatePath('/')

    return {
      success: true,
      data: {
        flash_text: flashText,
        summary: aiResult.summary,
        action_items: aiResult.action_items
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error procesando el texto' }
  }
}
