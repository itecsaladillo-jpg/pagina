'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────
// CRUD: Acciones ITEC
// ─────────────────────────────────────────
export async function createAccionAction(data: {
  titulo: string
  descripcion: string
  categoria: string
  fecha: string
  presupuesto_total: number
  impacto_social: string
  trascendencia_regional: string
  rubros_relacionados: string[]
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('acciones_itec')
    .insert([data])
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sponsors')
  return { success: true, data: result }
}

export async function deleteAccionAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('acciones_itec').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true }
}

// ─────────────────────────────────────────
// CRUD: Reportes de Sponsors
// ─────────────────────────────────────────
export async function createReporteAction(data: {
  sponsor_id: string
  periodo: string
  acciones_ids: string[]
  fondo_comun_detalle: any
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()

  // 1. Obtener info de las acciones seleccionadas para el prompt de IA
  const { data: acciones } = await supabase
    .from('acciones_itec')
    .select('titulo, impacto_social, trascendencia_regional, presupuesto_total, categoria')
    .in('id', data.acciones_ids)

  // 2. Generar reporte IA persuasivo
  let ai_reporte: string | null = null
  if (process.env.GEMINI_API_KEY && acciones?.length) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const accionesTexto = acciones.map(a =>
        `• ${a.titulo}: ${a.impacto_social || ''} — ${a.trascendencia_regional || ''}`
      ).join('\n')

      const { response } = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Sos el Director Ejecutivo de una ONG tecnológica de vanguardia. Redactá un párrafo de 3-4 oraciones, en primera persona plural, dirigido al sponsor.

El párrafo debe:
- Comenzar agradeciendo su aporte sin usar "gracias" directamente (usá sinónimos como "valoramos profundamente", "reconocemos con orgullo")
- Describir el valor INTANGIBLE de las acciones (impacto en el futuro productivo, vocaciones técnicas, posicionamiento regional)
- Usar lenguaje vanguardista y profesional
- PROHIBIDO usar: viste, che, pibe, hoy, ayer, mañana, gracias (como primera palabra), básicamente

Acciones del período:
${accionesTexto}

Respondé SOLO con el párrafo, sin introducción ni comillas.`
          }]
        }]
      })
      ai_reporte = response.text().trim()
    } catch (err) {
      console.error('[IA] Error generando reporte:', err)
    }
  }

  // 3. Guardar el reporte
  const { data: result, error } = await supabase
    .from('sponsor_reportes')
    .insert([{ ...data, ai_reporte }])
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true, data: result }
}

export async function updateSponsorAction(id: string, formData: any) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('sponsors').update(formData).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true }
}

export async function createSponsorAction(formData: any) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data, error } = await supabase.from('sponsors').insert([formData]).select().single()
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true, data }
}

export async function deleteSponsorAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/sponsors')
  return { success: true }
}
