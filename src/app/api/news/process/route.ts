import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

async function generarTextosIA(datos_crudos: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    systemInstruction: `Sos un Director de Comunicaciones Estratégicas de ITEC Saladillo. Transformás notas crudas en piezas de contenido profesional.
    RESTRICCIONES: No cites a Augusto Cicaré salvo que las notas lo requieran específicamente para contexto histórico. Priorizá la noticia actual.`
  })
  
  console.log('[IA] Generando contenido multicanal...')
  
  const prompt = `Generá ÚNICAMENTE un objeto JSON válido con estas 5 llaves EXACTAS: "titulo", "texto_publico", "texto_miembros", "texto_sponsors", "texto_medios".
  
  Canales y estilos:
  - titulo: Titular periodístico impactante, máximo 10 palabras
  - texto_publico: Periodista social/tercer sector. Pirámide invertida: título atractivo, bajada impactante, cuerpo descriptivo. Profesional, empático, accesible sin tecnicismos.
  - texto_miembros: Comunicación interna. Título cercano, cuerpo centrado en el equipo, cierre motivador. Cálido, entusiasta, reconocimiento. Lenguaje inclusivo ("nosotros", "nuestro esfuerzo").
  - texto_sponsors: Reporte ejecutivo institucional, enfoque costo/beneficio.
  - texto_medios: Gacetilla periodística con TÍTULO, COPETE, CUERPO.
  
  DATOS CRUDOS:
  """${datos_crudos}"""
  
  No incluyas markdown ni explicaciones. Solo el JSON:`
  
  try {
    console.log('[IA] Llamando a Gemini...')
    const result = await model.generateContent(prompt)
    let raw = result.response.text().trim()
    console.log('[IA] Respuesta cruda recibida, longitud:', raw.length)
    
    // Limpieza de bloques de código markdown
    raw = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    
    // Parsear JSON
    const parsed = JSON.parse(raw)
    console.log('[IA] JSON parseado exitosamente, llaves:', Object.keys(parsed))
    
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