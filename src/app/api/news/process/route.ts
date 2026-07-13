import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1'
})

function limpiarJSON(texto: string): string {
  const jsonMatch = texto.match(/\{[\s\S]*"[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function generarTextosIA(datos_crudos: string) {
  const prompt = `Generá UNICAMENTE JSON válido SIN markdown:
{"titulo": "título (máx 10 palabras)", "texto_publico": "3-6 oraciones con cita incluida", "texto_miembros": "3-6 oraciones tono interno con 'nosotros'", "texto_sponsors": "3-6 oraciones foco ROI e impacto", "texto_medios": "gacetilla periodística con título/copete/cuerpo"}

Datos: ${datos_crudos}`

  try {
    console.log('[IA] Llamando a Grok...')
    const result = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
    
    const raw = limpiarJSON(result.choices[0]?.message?.content?.trim() || '{}')
    console.log('[IA] Respuesta cruda, longitud:', raw.length)
    
    const parsed = JSON.parse(raw)
    console.log('[IA] JSON parseado')
    
    return {
      titulo: parsed.titulo || '',
      texto_publico: parsed.texto_publico || '',
      texto_miembros: parsed.texto_miembros || '',
      texto_sponsors: parsed.texto_sponsors || '',
      texto_medios: parsed.texto_medios || ''
    }
  } catch (err: any) {
    console.error('[IA] Error:', err)
    return {
      titulo: 'Novedad ITEC',
      texto_publico: datos_crudos.slice(0, 200),
      texto_miembros: datos_crudos.slice(0, 150),
      texto_sponsors: 'Reporte pendiente.',
      texto_medios: 'Gacetilla pendiente.'
    }
  }
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
    const textos = await generarTextosIA(datos_crudos)
    return NextResponse.json({ success: true, result: textos })
  } catch (err: any) {
    return NextResponse.json({ error: 'Error de conexión: ' + (err.message || 'Error desconocido') }, { status: 500 })
  }
}