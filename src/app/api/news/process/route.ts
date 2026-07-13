import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

async function generarTextosIA(datos_crudos: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    systemInstruction: `Sos el Jefe de Prensa de ITEC. Generás notas profesionales. 
    FORMATO ESTRICTO: ÚNICAMENTE JSON con llaves "titulo", "texto_publico", "texto_miembros", "texto_sponsors", "texto_medios". 
    SIN markdown, SIN explicaciones, SIN texto extra.`
  })
  
  console.log('[IA] Generando contenido multicanal...')
  
  const prompt = `Generá ÚNICAMENTE un JSON válido SIN markdown, SIN explicaciones:
{"titulo": "máximo 10 palabras", "texto_publico": "3-6 oraciones, sin tecnicismos, con cita incluida", "texto_miembros": "3-6 oraciones, tono interno, 'nosotros'", "texto_sponsors": "3-6 oraciones, foco en ROI e impacto", "texto_medios": "gacetilla periodística"}
Datos: "${datos_crudos}"`
  
  try {
    console.log('[IA] Llamando a Gemini...')
    const result = await model.generateContent(prompt)
    let raw = result.response.text().trim()
    console.log('[IA] Respuesta cruda recibida, longitud:', raw.length)
    console.log('[IA] Respuesta cruda:', raw)
    
    // Limpieza de bloques de código markdown
    raw = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    
    console.log('[IA] Después de limpieza, longitud:', raw.length)
    console.log('[IA] Texto limpio:', raw.substring(0, 800))
    
    // Intentar parsear como JSON
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch (parseErr) {
      // Si falla, intentar extraer JSON de la respuesta
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw parseErr
      }
    }
    
    console.log('[IA] JSON parseado exitosamente, llaves:', Object.keys(parsed))
    console.log('[IA] texto_publico longitud:', parsed.texto_publico?.length || 0)
    console.log('[IA] texto_miembros longitud:', parsed.texto_miembros?.length || 0)
    
    return {
      titulo: parsed.titulo || '',
      texto_publico: parsed.texto_publico || '',
      texto_miembros: parsed.texto_miembros || '',
      texto_sponsors: parsed.texto_sponsors || '',
      texto_medios: parsed.texto_medios || ''
    }
  } catch (err: any) {
    console.error('[IA] Error:', err)
    // Fallback sin IA
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
    console.error('[API] No autorizado - member:', member?.id, 'role:', member?.role)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  console.log('[API] Usuario autorizado:', member.id)

  const body = await request.json()
  const { datos_crudos } = body
  console.log('[API] Datos recibidos - longitud:', datos_crudos?.length)

  if (!datos_crudos || datos_crudos.length < 20) {
    console.error('[API] Datos crudos inválidos')
    return NextResponse.json({ error: 'Los datos crudos son obligatorios y deben tener al menos 20 caracteres' }, { status: 400 })
  }

  try {
    const textos = await generarTextosIA(datos_crudos)
    console.log('[API] Textos generados exitosamente:', Object.keys(textos))

    return NextResponse.json({ success: true, result: textos })
  } catch (err: any) {
    console.error('[API] Error procesando con IA:', err)
    return NextResponse.json({ error: 'Error de conexión con Gemini: ' + (err.message || 'Error desconocido') }, { status: 500 })
  }
}