import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { generateMulticanalNews } from '@/services/ai'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  console.log('[API /news/process] Iniciando request...')
  
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    console.error('[API /news/process] No autorizado. Member:', member?.role || 'null')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let datos_crudos: string
  try {
    const body = await request.json()
    datos_crudos = body.datos_crudos
  } catch {
    console.error('[API /news/process] JSON inválido en body')
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!datos_crudos || datos_crudos.length < 20) {
    console.error('[API /news/process] datos_crudos inválido:', datos_crudos?.length || 0, 'chars')
    return NextResponse.json({ error: 'Los datos crudos son obligatorios y deben tener al menos 20 caracteres' }, { status: 400 })
  }

  console.log(`[API /news/process] Procesando ${datos_crudos.length} chars con IA...`)
  const startTime = Date.now()

  try {
    const raw = await generateMulticanalNews(datos_crudos)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[API /news/process] IA completada en ${elapsed}s`)
    
    const result = {
      titulo: raw.titulo || '',
      texto_publico: raw.texto_publico || '',
      texto_miembros: raw.texto_miembros || '',
      texto_sponsors: raw.texto_sponsors || '',
      texto_medios: raw.texto_medios || ''
    }
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.error(`[API /news/process] Error después de ${elapsed}s:`, err.message, err.stack)
    const errorMsg = err.message || err.toString() || 'Error desconocido'
    return NextResponse.json({ error: 'Error al procesar con IA: ' + errorMsg }, { status: 500 })
  }
}