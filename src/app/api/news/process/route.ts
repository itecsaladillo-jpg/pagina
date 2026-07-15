import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'

function limpiarJSON(texto: string): string {
  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function generarTextosIA(datos_crudos: string) {
  const prompt = `Sos un Director de Comunicaciones Estratégicas. Generá EXACTAMENTE un JSON sin markdown ni explicaciones:
{"titulo": "título atractivo máximo 10 palabras", "texto_publico": "3-6 oraciones, tono aspiracional para vecinos de Saladillo, sin mencionar a Augusto Cicaré a menos que aparezca en los datos", "texto_miembros": "3-6 oraciones, tono interno cálido usando 'nosotros', agradeciendo al equipo voluntario", "texto_sponsors": "3-6 oraciones, tono ejecutor, mencionando ROI e impacto económico con números si están en los datos", "texto_medios": "gacetilla periodística con titular, datos clave y cita simulada"}

DATOS DEL EVENTO: ${datos_crudos}`

  try {
    console.log('[IA] Llamando a Groq...')
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }
    
    const result = await response.json()
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
    console.error('[IA] Error:', err.message)
    return {
      titulo: 'Novedad ITEC',
      texto_publico: datos_crudos,
      texto_miembros: datos_crudos,
      texto_sponsors: datos_crudos,
      texto_medios: datos_crudos
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