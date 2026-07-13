import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

async function generarTextosIA(datos_crudos: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    systemInstruction: `Sos el Jefe de Prensa y Comunicaciones de ITEC. Transformás información cruda en textos de alta calidad.
    RESTRICCIONES: No cites a Augusto Cicaré salvo que sea necesario para contexto histórico. Priorizá el "para qué" sobre el "cómo".`
  })
  
  console.log('[IA] Generando contenido multicanal...')
  
  const prompt = `Sos el Jefe de Prensa y Comunicaciones de ITEC. Transformás información cruda en textos de alta calidad.

FORMATO DE SALIDA REQUERIDO:
{"titulo": "string", "texto_publico": "string", "texto_miembros": "string", "texto_sponsors": "string", "texto_medios": "string"}

INSTRUCCIONES GENERALES:
1. Identificá el "Viaje del Héroe": desafío inicial, acción de ITEC, transformación positiva lograda
2. Incluye una cita breve y natural (real o simulada) de un beneficiario o miembro
3. Usá subtítulos claros en negrita (**Subtítulo**) y párrafos cortos (máximo 4 líneas)
4. Evitá frases burocráticas ("La organización informa que...")

TEXTO PÚBLICO (AUDIENCIA: PÚBLICO EXTERNO):
- Viaje del Héroe con gancho impactante al inicio (pirámide invertida)
- Lenguaje accesible, sin tecnicismos
- Enfócate en el propósito: inspirar y generar confianza
- Cierre con frase reflexiva que invite a conocer más sobre ITEC
- 3-6 párrafos separados por saltos de línea

TEXTO MIEMBROS (AUDIENCIA: EQUIPO INTERNO):
- Viaje del Héroe celebrando el esfuerzo colectivo
- Lenguaje cálido, entusiasta, usando "nosotros", "nuestro esfuerzo"
- Resaltá el valor de cada área en el éxito
- Cierre: agradecimiento + visión a futuro
- 3-6 párrafos separados por saltos de línea

TEXTO SPONSORS:
- Enfoque ROI y visión estratégica
- 3-6 párrafos

TEXTO MEDIOS:
- Formato gacetilla: "TÍTULO: ...\nCOPETE: ...\nCUERPO: ..."
- 3-6 párrafos

DATOS CRUDOS DEL EVENTO:
"""${datos_crudos}"""

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