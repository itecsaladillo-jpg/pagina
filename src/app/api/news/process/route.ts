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
  
  const prompt = `Generá ÚNICAMENTE este JSON (sin markdown, sin explicaciones):

{"titulo": "string de máximo 10 palabras", "texto_publico": "3-6 párrafos cortos", "texto_miembros": "3-6 párrafos con nosotros", "texto_sponsors": "3-6 párrafos", "texto_medios": "gacetilla"}

EJEMPLO COMPLETO:
{
  "titulo": "Robótica transforma educación rural",
  "texto_publico": "Desafío: Escuelas rurales sin conectividad tecnológica.\nAcción: ITEC implementó laboratorios móviles con sensores.\nTransformación: 200 estudiantes ahora programan robots autónomos.\nCita: \"Como dijo una docente: Esto abre puertas que creíamos cerradas\".\nITEC sigue construyendo el futuro tecnológico de la región.",
  "texto_miembros": "¡Desafío superado con excelencia!\nNuestro equipo de robótica integró sensores avanzados en tiempo récord.\nEl área de capacitación adaptó el currículo para 200 estudiantes.\nGracias al staff de medios por la cobertura profesional.\nNosotros transformamos realidades con nuestro esfuerzo colectivo. Próximo reto: IA agrícola.",
  "texto_sponsors": "Inversión en robótica educativa generó ROI social del 300%.\nNuestro programa alcanzó 200 beneficiarios directos.\nImpacto en formación STEM: 15 nuevas competencias desarrolladas.\nProyección regional: replicaremos el modelo en 5 localidades.\nLas alianzas estratégicas son clave para escalar el impacto.",
  "texto_medios": "TÍTULO: Robótica revoluciona educación en Saladillo\nCOPETE: 200 estudiantes acceden por primera vez a la programación.\nCUERPO: ITEC implementó laboratorios móviles tecnológicos. La iniciativa responde a la carencia de conectividad rural. Los kits incluyen sensores de última generación. Una docente destacó el cambio en la motivación estudiantil. El programa se expandirá a 5 localidades."
}

APLICÁ este formato a ESTOS DATOS:
${datos_crudos}`
  
  try {
    console.log('[IA] Llamando a Gemini...')
    const result = await model.generateContent(prompt)
    let raw = result.response.text().trim()
    console.log('[IA] Respuesta cruda recibida, longitud:', raw.length)
    console.log('[IA] Respuesta cruda:', raw.substring(0, 500))
    
    // Limpieza de bloques de código markdown
    raw = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    
    // Parsear JSON
    const parsed = JSON.parse(raw)
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