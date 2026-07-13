import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY_2 || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

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
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    systemInstruction: `Sos el Jefe de Prensa de ITEC. Generás notas profesionales. 
    Lenguaje rioplatense, sin "hoy/ayer/mañana/che/viste/pibe".`,
  })
  
  const prompt = `Generá UNICAMENTE JSON válido:
{"titulo": "título", "texto_publico": "3-6 oraciones", "texto_miembros": "3-6 oraciones", "texto_sponsors": "3-6 oraciones", "texto_medios": "gacetilla"}
Datos: ${datos_crudos}
JSON:`

  try {
    console.log('[IA] Llamando a Gemini...')
    const result = await model.generateContent(prompt)
    const raw = limpiarJSON(result.response.text().trim())
    console.log('[IA] Respuesta cruda, longitud:', raw.length)
    console.log('[IA] Texto:', raw.substring(0, 400))
    
    const parsed = JSON.parse(raw)
    console.log('[IA] JSON parseado, texto_publico length:', parsed.texto_publico?.length || 0)
    
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
  console.log('[API] Procesar noticias - inicio')
  
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
    return NextResponse.json({ error: 'Error de conexión con Gemini: ' + (err.message || 'Error desconocido') }, { status: 500 })
  }
}