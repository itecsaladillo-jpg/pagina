import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { generateMulticanalNews } from '@/services/ai'

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
    const raw = await generateMulticanalNews(datos_crudos)
    const result = {
      titulo: raw.titulo || '',
      texto_publico: raw.texto_publico || '',
      texto_miembros: raw.texto_miembros || '',
      texto_sponsors: raw.texto_sponsors || '',
      texto_medios: raw.texto_medios || ''
    }
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[IA] Error:', err.message, err.stack)
    const errorMsg = err.message || err.toString() || 'Error desconocido'
    return NextResponse.json({ error: 'Error al procesar con IA: ' + errorMsg }, { status: 500 })
  }
}