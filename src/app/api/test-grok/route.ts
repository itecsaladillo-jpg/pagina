import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1'
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { datos_crudos } = body
  
  const prompt = `JSON únicamente:
{"titulo": "título", "texto_publico": "3-6 oraciones", "texto_miembros": "3-6 oraciones", "texto_sponsors": "3-6 oraciones", "texto_medios": "gacetilla"}
Datos: ${datos_crudos}`

  try {
    const result = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
    return NextResponse.json({ raw: result.choices[0]?.message?.content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}