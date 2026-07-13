import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY_2 || '')

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { datos_crudos } = body
  
  if (!datos_crudos) {
    return NextResponse.json({ error: 'Falta datos_crudos' })
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  const prompt = `JSON únicamente:
{"titulo": "título", "texto_publico": "3-6 oraciones", "texto_miembros": "3-6 oraciones", "texto_sponsors": "3-6 oraciones", "texto_medios": "gacetilla"}
Datos: ${datos_crudos}`

  try {
    const result = await model.generateContent(prompt)
    return NextResponse.json({ 
      raw: result.response.text(),
      length: result.response.text().length 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}