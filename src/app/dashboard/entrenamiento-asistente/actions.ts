'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { updateAIPrompt } from '@/services/admin'
import { revalidatePath } from 'next/cache'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const DOCS_PATH = path.join(process.cwd(), 'docs')

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
    const result = await updateAIPrompt('asistente_global', formData)
    revalidatePath('/dashboard/entrenamiento-asistente')
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function listDocsAction() {
  try {
    await fs.access(DOCS_PATH)
    const files = await fs.readdir(DOCS_PATH)
    const details = await Promise.all(
      files.map(async (name) => {
        const stat = await fs.stat(path.join(DOCS_PATH, name))
        return {
          name,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        }
      })
    )
    details.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    return { success: true, files: details }
  } catch (err: any) {
    if (err.code === 'ENOENT') return { success: true, files: [] }
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

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.mkdir(DOCS_PATH, { recursive: true })
    await fs.writeFile(path.join(DOCS_PATH, file.name), buffer)

    return { success: true, fileName: file.name }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteDocAction(fileName: string) {
  try {
    await ensureAdmin()
    const filePath = path.join(DOCS_PATH, fileName)
    await fs.unlink(filePath)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function syncDocsAction() {
  try {
    await ensureAdmin()
    const { stdout, stderr } = await execAsync('npm run sync-docs', {
      cwd: process.cwd(),
    })
    console.log('[syncDocs]', stdout)
    if (stderr) console.warn('[syncDocs]', stderr)
    revalidatePath('/dashboard/entrenamiento-asistente')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
