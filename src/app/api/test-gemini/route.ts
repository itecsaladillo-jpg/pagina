import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_API_BASE_URL || 'https://ai.itecsaladillo.org.ar'
const OLLAMA_MODEL = 'llama3.2:latest'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { datos_crudos } = body
  
  if (!datos_crudos) {
    return NextResponse.json({ error: 'Falta datos_crudos' })
  }

  try {
    const timeout = 98000
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { 
            role: 'system', 
            content: 'Sos un asistente de IA para ITEC Saladillo. Respondés únicamente en formato JSON puro, sin markdown ni bloques de código.' 
          },
          { 
            role: 'user', 
            content: `JSON únicamente: {"titulo": "título", "texto_publico": "3-6 oraciones", "texto_miembros": "3-6 oraciones", "texto_sponsors": "3-6 oraciones", "texto_medios": "gacetilla"}\nDatos: ${datos_crudos}` 
          }
        ],
        stream: false,
        options: { num_ctx: 2048 },
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Error en Ollama: ${response.status}${text ? ` - ${text}` : ''}`)
    }

    const data = await response.json()
    const text = data.message?.content || ''
    
    return NextResponse.json({ 
      raw: text,
      length: text.length 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}