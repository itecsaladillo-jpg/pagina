import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

async function generarTextosIA(datos_crudos: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const tituloPrompt = `Actuarás como editor de titulares periodísticos. Generá un TÍTULO IMPACTANTE y llamativo (máximo 10 palabras) para esta noticia del agro/instituto. Debe ser corto, potente y transmitir la esencia del evento. Devolvé SOLO el título. DATOS: ${datos_crudos}`
  
  const prompts = {
    publico: `Actuarás como editor de prensa regional. Redactá un texto para el público con tono inspirador. NO mencionés biografía de Cicaré. Máximo 200 palabras. Devolvé SOLO el texto.`,
    miembros: `Actuarás como community manager. Redactá un texto para miembros internos con tono de logro superador y motivación. Máximo 150 palabras. Devolvé SOLO el texto.`,
    medios: `Actuarás como redactor de gacetillas. Generá un formato periodístico con: TÍTULO (máx 10 palabras), COPETE (1 línea), CUERPO (máx 200 palabras, párrafos cortos). Devolvé SOLO el texto con formato: "Título: ...\nCopete: ...\nCuerpo: ..."`,
    sponsors: `Actuarás como analista de relaciones institucionales. Generá un reporte ejecutivo con enfoque en costo/beneficio y visión de alianza. Máximo 250 palabras. Devolvé SOLO el texto.`
  }

  const resultados: any = {}
  
  try {
    const tituloResult = await model.generateContent(tituloPrompt)
    resultados.titulo = tituloResult.response.text().trim().replace(/^["']|["']$/g, '')
  } catch (err) {
    console.error('Error generando titulo:', err)
    resultados.titulo = datos_crudos.slice(0, 100).replace(/\n/g, ' ') + (datos_crudos.length > 100 ? '...' : '')
  }
  
  for (const [canal, prompt] of Object.entries(prompts)) {
    try {
      const result = await model.generateContent(prompt + '\n\nDatos: ' + datos_crudos)
      const text = result.response.text()
      resultados[canal] = text
    } catch (err) {
      console.error(`Error generando ${canal}:`, err)
      resultados[canal] = `Error generando texto para ${canal}`
    }
  }

  return resultados
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { datos_crudos } = await request.json()

  try {
    const textos = await generarTextosIA(datos_crudos)

    return NextResponse.json({ success: true, result: textos })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}