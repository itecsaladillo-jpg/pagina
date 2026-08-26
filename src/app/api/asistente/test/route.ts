import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint mínimo para testear OpenRouter directamente.
 * GET  = test de env vars
 * POST = test de OpenRouter con el mismo payload que el asistente
 */
export async function GET() {
  return NextResponse.json({
    OPENROUTER: !!process.env.OPENROUTER_API_KEY,
    keyPreview: process.env.OPENROUTER_API_KEY?.slice(0, 8) + '...',
  })
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No OPENROUTER_API_KEY' }, { status: 500 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const messages = body.messages || [{ role: 'user', content: 'Hola, ¿qué es ITEC?' }]

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://itecsaladillo.org.ar',
        'X-Title': 'ITEC Test'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 1024
      }),
      signal: AbortSignal.timeout(30000),
    })

    const text = await res.text()
    return NextResponse.json({ status: res.status, ok: res.ok, body: text.slice(0, 1000) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
