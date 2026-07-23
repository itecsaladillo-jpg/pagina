'use server'

import { createClient } from '@/lib/supabase/server'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
import { getCurrentMember } from '@/services/auth'
import { revalidateTag } from 'next/cache'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const BUCKET = 'training-docs'

async function ensureAdmin() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    throw new Error('No tenés permisos de administrador.')
  }
}

export async function getPromptAction() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('ai_prompt_settings')
      .select('*')
      .eq('clave_prompt', 'asistente_global')
      .single()
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function savePromptAction(formData: {
  system_prompt: string
  temperature: number
  max_tokens: number
}) {
  try {
    await ensureAdmin()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado.' }

    const { data, error } = await supabase
      .from('ai_prompt_settings')
      .update({
        system_prompt: formData.system_prompt,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('clave_prompt', 'asistente_global')
      .select()

    if (error) return { success: false, error: error.message }
    revalidateTag('ai-prompt-settings', 'max')
    revalidatePath('/dashboard/entrenamiento-asistente')
    return { success: true, data: data?.[0] || null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function listDocsAction() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.storage.from(BUCKET).list()
    if (error) return { success: false, error: error.message }

    const files = (data || []).map((f: any) => ({
      name: f.name,
      size: f.metadata?.size || 0,
      modifiedAt: f.updated_at || f.created_at || new Date().toISOString(),
    }))
    files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    return { success: true, files }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function uploadDocAction(formData: FormData) {
  try {
    await ensureAdmin()

    const file = formData.get('file') as File | null
    if (!file) return { success: false, error: 'No se envió ningún archivo.' }

    const ext = file.name.toLowerCase().split('.').pop()
    if (!['pdf', 'txt', 'md'].includes(ext || '')) {
      return { success: false, error: 'Solo se aceptan archivos PDF, TXT o MD.' }
    }

    const supabase = await createClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const { error } = await supabase.storage.from(BUCKET).upload(safeName, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

    if (error) {
      console.error('[uploadDocAction] Storage error:', error)
      return { success: false, error: `Error de Storage: ${error.message}` }
    }
    return { success: true, fileName: safeName, originalName: file.name }
  } catch (err: any) {
    console.error('[uploadDocAction] Error:', err)
    return { success: false, error: err?.message || 'Error interno del servidor' }
  }
}

export async function deleteDocAction(fileName: string) {
  try {
    await ensureAdmin()
    const supabase = await createClient()
    const { error } = await supabase.storage.from(BUCKET).remove([fileName])
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function syncDocsAction() {
  try {
    await ensureAdmin()
    const supabase = await createClient()

    const { data: fileList, error: listError } = await supabase.storage.from(BUCKET).list()
    if (listError) return { success: false, error: listError.message }
    if (!fileList?.length) {
      return { success: false, error: 'No hay documentos para sincronizar.' }
    }

    const tmpDir = path.join(os.tmpdir(), 'itec-sync-' + Date.now())
    await fs.mkdir(tmpDir, { recursive: true })
    const texts: string[] = []
    const errores: string[] = []

    for (const f of fileList) {
      const { data: blob, error: dlError } = await supabase.storage.from(BUCKET).download(f.name)
      if (dlError || !blob) {
        errores.push(`${f.name}: error al descargar`)
        continue
      }

      const filePath = path.join(tmpDir, f.name)
      await fs.writeFile(filePath, Buffer.from(await blob.arrayBuffer()))

      const lower = f.name.toLowerCase()
      let text = ''
      if (lower.endsWith('.pdf')) {
        try {
          const pdfParse = require('pdf-parse/lib/pdf-parse.js')
          const dataBuf = await fs.readFile(filePath)
          const parsed = await pdfParse(dataBuf)
          text = parsed.text || ''
          if (!text.trim()) errores.push(`${f.name}: PDF parseado pero sin texto extraíble`)
        } catch (e: any) {
          errores.push(`${f.name}: ${e?.message || 'Error al parsear PDF'}`)
        }
      } else if (lower.endsWith('.txt') || lower.endsWith('.md')) {
        text = await fs.readFile(filePath, 'utf8')
        if (!text.trim()) errores.push(`${f.name}: archivo vacío`)
      } else {
        errores.push(`${f.name}: extensión no soportada (${lower.split('.').pop()})`)
      }

      if (text.trim()) {
        texts.push(`--- Inicio del documento: ${f.name} ---\n${text.trim()}\n--- Fin del documento: ${f.name} ---`)
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true })

    const combinedText = texts.join('\n\n')
    if (!combinedText) {
      return { success: false, error: `No se pudo extraer texto. Detalles: ${errores.join(' | ')}` }
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error: upsertError } = await supabase
      .from('ai_prompt_settings')
      .upsert({
        clave_prompt: 'docs_context',
        system_prompt: combinedText,
        descripcion: 'Contexto extraído de documentos de entrenamiento',
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clave_prompt' })

    if (upsertError) return { success: false, error: upsertError.message }

    revalidateTag('ai-prompt-settings', 'max')
    revalidatePath('/dashboard/entrenamiento-asistente')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
