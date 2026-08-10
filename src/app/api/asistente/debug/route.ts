import { NextResponse } from 'next/server'

export async function GET() {
  const result: Record<string, any> = {}

  // 1. Env vars
  result.env = {
    OPENROUTER: !!process.env.OPENROUTER_API_KEY,
    HF: !!process.env.HF_API_KEY,
    GEMINI: !!(process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
    SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  // 2. Test OpenRouter directly
  const orKey = process.env.OPENROUTER_API_KEY
  if (orKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://itecsaladillo.org.ar',
          'X-Title': 'ITEC Debug'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-nano-30b-a3b:free',
          messages: [{ role: 'user', content: 'Say hi in 3 words' }],
          max_tokens: 50
        }),
        signal: AbortSignal.timeout(15000),
      })
      const body = await res.text()
      result.openRouter = { status: res.status, ok: res.ok, body: body.slice(0, 500) }
    } catch (e: any) {
      result.openRouter = { error: e.message }
    }
  } else {
    result.openRouter = { error: 'No OPENROUTER_API_KEY' }
  }

  // 3. Test Gemini directly
  const gKey = process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  if (gKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say hi in 3 words' }] }],
            generationConfig: { maxOutputTokens: 50 },
          }),
          signal: AbortSignal.timeout(15000),
        }
      )
      const body = await res.text()
      result.gemini = { status: res.status, ok: res.ok, body: body.slice(0, 500) }
    } catch (e: any) {
      result.gemini = { error: e.message }
    }
  } else {
    result.gemini = { error: 'No Gemini key' }
  }

  return NextResponse.json(result)
}
