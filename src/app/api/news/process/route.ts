import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

async function generarTextosIA(datos_crudos: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    systemInstruction: `Sos el Jefe de Prensa de ITEC. Generás notas profesionales. 
    FORMATO ESTRICTO: ÚNICAMENTE JSON con llaves "titulo", "texto_publico", "texto_miembros", "texto_sponsors", "texto_medios". 
    SIN markdown, SIN explicaciones, SIN texto extra.`
  })
  
  console.log('[IA] Generando contenido multicanal...')
  
  const prompt = `Generá ÚNICAMENTE un JSON válido con estas llaves: "titulo", "texto_publico", "texto_miembros", "texto_sponsors", "texto_medios".

EJEMPLOS DE FORMATO:

PARA texto_publico:
{
  "titulo": "Innovación tecnológica llega a Saladillo",
  "texto_publico": "Desafío: Las escuelas rurales carecían de conectividad.\nAcción: ITEC implementó laboratorios móviles de robótica.\nTransformación: 300 estudiantes ahora dominan la programación.\nComo dijo una docente: \"Esto abre puertas que creíamos cerradas\".\nITEC sigue construyendo el futuro tecnológico de la región."
}

PARA texto_miembros:
{
  "texto_publico": "Desafío superado con excelencia.\nNuestro equipo técnico integró sensores avanzados.\nEl área de robótica entregó los kits a tiempo.\nGracias al staff de medios por la cobertura.\nNosotros transformamos realidades. Próximo reto: IA agrícola."
}

INSTRINCCIONES EXTRAS:
- Viaje del Héroe: Desafío → Acción ITEC → Transformación
- Cita natural: "Como dijo [rol]: \"frase impactante\""
- Párrafos cortos, 3-6 por texto
- Sin tecnicismos para público, lenguaje cálido para miembros ("nosotros", "nuestro")

DATOS: "${datos_crudos}"

JSON:`
  
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