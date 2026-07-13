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
  
  const prompt = `Sos un Director de Comunicaciones Estratégicas de ITEC Saladillo. Generá textos de alta calidad profesional.

RESTRICCIONES CRÍTICAS:
- No menciones a Augusto Cicaré salvo que las notas lo requieran específicamente para contexto histórico
- Usá lenguaje rioplatense formal, SIN "hoy", "ayer", "mañana", "che", "viste", "pibe"
- Devolvé SOLO el JSON, sin explicaciones ni markdown

Generá SOLO este JSON con las 5 llaves exactas:
{"titulo": "string", "texto_publico": "string", "texto_miembros": "string", "texto_sponsors": "string", "texto_medios": "string"}

ESPECÍFICAS POR CANAL:

TÍTULO: Titular periodístico impactante (máximo 10 palabras) sobre la acción/evento

TEXTO PÚBLICO: 
- Rol: Periodista del tercer sector
- Estructura: Pirámide invertida con título atractivo, bajada impactante, cuerpo descriptivo
- Tono: Profesional, empático, transparente, accesible
- Enfoque: Conectá la acción con el impacto social y beneficio para Saladillo
- Límite: 200 palabras exactas

TEXTO MIEMBROS:
- Rol: Comunicación interna
- Estructura: Título cercano, cuerpo centrado en el equipo, cierre motivador
- Tono: Cálido, entusiasta, de reconocimiento
- Lenguaje: Inclusivo ("nosotros", "nuestro esfuerzo")
- Enfoque: Resaltá el "quiénes" del logro, desafíos superados, victoria compartida
- Límite: 150 palabras exactas

TEXTO SPONSORS:
- Rol: Analista de relaciones institucionales
- Tono: Ejecutivo, enfoque ROI y visión estratégica
- Límite: 250 palabras exactas

TEXTO MEDIOS:
- Rol: Redactor de gacetilla
- Formato: "TÍTULO: ...\nCOPETE: ...\nCUERPO: ..." (párrafos cortos)
- Límite: 200 palabras exactas

DATOS DEL EVENTO:
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