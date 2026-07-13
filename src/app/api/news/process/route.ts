import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

async function generarTextosIA(datos_crudos: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    systemInstruction: `Actuarás como editor de titulares periodísticos e información multicanal para ITEC Saladillo. 
    Generá contenidos en español rioplatense, profesionales, impactantes y positivos.
    RESTRICCIONES: No usar "hoy", "ayer", "mañana", "che", "viste", "pibe".`
  })
  
  console.log('[IA] Generando título para:', datos_crudos.slice(0, 100))
  const tituloPrompt = `Actuarás como editor de titulares periodísticos. Generá un TÍTULO IMPACTANTE y llamativo (máximo 10 palabras) para esta noticia del agro/instituto. Debe ser corto, potente y transmitir la esencia del evento. Devolvé SOLO el título, sin markdown ni comillas. DATOS: ${datos_crudos}`
  
  const prompts = {
    publico: `Actuarás como editor de prensa regional. Redactá un texto para el público con tono inspirador. NO mencionés biografía de Cicaré. Máximo 200 palabras. Devolvé SOLO el texto.`,
    miembros: `Actuarás como community manager. Redactá un texto para miembros internos con tono de logro superador y motivación. Máximo 150 palabras. Devolvé SOLO el texto.`,
    medios: `Actuarás como redactor de gacetillas. Generá un formato periodístico con: TÍTULO (máx 10 palabras), COPETE (1 línea), CUERPO (máx 200 palabras, párrafos cortos). Devolvé SOLO el texto con formato: "Título: ...\nCopete: ...\nCuerpo: ..."`,
    sponsors: `Actuarás como analista de relaciones institucionales. Generá un reporte ejecutivo con enfoque en costo/beneficio y visión de alianza. Máximo 250 palabras. Devolvé SOLO el texto.`
  }

  const resultados: any = {}
  
  // Generar título
  try {
    console.log('[IA] Llamando a Gemini para título...')
    const tituloResult = await model.generateContent(tituloPrompt)
    const tituloRaw = tituloResult.response.text().trim()
    console.log('[IA] Respuesta título recibida:', tituloRaw)
    resultados.titulo = tituloRaw.replace(/^["']|["']$/g, '').replace(/^\*+|\*+$/g, '')
  } catch (err: any) {
    console.error('[IA] Error generando título:', err)
    resultados.titulo = datos_crudos.slice(0, 100).replace(/\n/g, ' ') + (datos_crudos.length > 100 ? '...' : '')
  }
  
  // Generar textos por canal
  for (const [canal, prompt] of Object.entries(prompts)) {
    try {
      console.log(`[IA] Llamando a Gemini para ${canal}...`)
      const result = await model.generateContent(prompt + '\n\nDatos: ' + datos_crudos)
      const text = result.response.text()
      console.log(`[IA] Respuesta ${canal} recibida, longitud:`, text.length)
      resultados[canal] = text
    } catch (err: any) {
      console.error(`[IA] Error generando ${canal}:`, err?.message || err)
      resultados[canal] = `Error generando texto para ${canal}`
    }
  }

  return resultados
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