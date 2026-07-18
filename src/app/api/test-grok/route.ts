import { NextRequest, NextResponse } from 'next/server'

function limpiarJSON(texto: string): string {
  const jsonMatch = texto.match(/\{[\s\S]*"[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { datos_crudos } = body

  const prompt = `Generá ÚNICAMENTE un JSON válido SIN markdown ni explicaciones:
{"titulo": "título (máx 10 palabras)", "texto_publico": "3-6 oraciones con cita incluida", "texto_miembros": "3-6 oraciones tono interno con 'nosotros'", "texto_sponsors": "3-6 oraciones foco ROI e impacto", "texto_medios": "gacetilla periodística"}

Datos: ${datos_crudos}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    const raw = limpiarJSON(result.choices[0]?.message?.content?.trim() || '{}')
    const parsed = JSON.parse(raw)

    return NextResponse.json({ success: true, result: parsed })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error de conexión' }, { status: 500 })
  }
}