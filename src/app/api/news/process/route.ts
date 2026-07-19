import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { generateMulticanalNews } from '@/services/ai'

function limpiarJSON(texto: string): string {
  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { datos_crudos } = body

  if (!datos_crudos || datos_crudos.length < 20) {
    return NextResponse.json({ error: 'Los datos crudos son obligatorios y deben tener al menos 20 caracteres' }, { status: 400 })
  }

  try {
    const result = await generateMulticanalNews(datos_crudos)
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[IA] Error:', err.message)
    const errorMsg = err.message || err.toString() || 'Error desconocido'
    return NextResponse.json({ error: 'Error al procesar con IA: ' + errorMsg }, { status: 500 })
  }
}