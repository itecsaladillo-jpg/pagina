import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET() {
  const result: Record<string, any> = {}

  // 1. Env vars summary
  result.env = {
    OPENROUTER: !!process.env.OPENROUTER_API_KEY,
    OPENROUTER_KEY_PREFIX: process.env.OPENROUTER_API_KEY?.slice(0, 12) + '...',
    GROQ: !!process.env.GROQ_API_KEY,
    GROQ_KEY_PREFIX: process.env.GROQ_API_KEY?.slice(0, 12) + '...',
    HF: !!process.env.HF_API_KEY,
    GEMINI: !!(process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    OLLAMA_URL: (process.env.OLLAMA_API_BASE_URL || 'https://ai.itecsaladillo.org.ar').slice(0, 40) + '...',
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
    SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  // 2. Check Supabase api_settings for overridden keys
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (supabaseUrl && serviceKey) {
    try {
      const adminClient = createSupabaseClient(supabaseUrl, serviceKey)
      const { data } = await adminClient
        .from('api_settings')
        .select('key, value')

      result.supabaseSettings = data?.map(r => ({
        key: r.key,
        hasValue: !!r.value && r.value.trim() !== '',
        prefix: r.value ? r.value.slice(0, 8) + '...' : '(empty)'
      })) || []
    } catch (e: any) {
      result.supabaseSettings = { error: e.message }
    }
  }

  // 3. Test Ollama
  const ollamaUrl = process.env.OLLAMA_API_BASE_URL || 'https://ai.itecsaladillo.org.ar'
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    })
    const body = await res.text()
    result.ollama = { url: ollamaUrl, status: res.status, ok: res.ok, body: body.slice(0, 300) }
  } catch (e: any) {
    result.ollama = { url: ollamaUrl, error: e.message }
  }

  // 4. Test OpenRouter
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

  // 5. Test Groq
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say hi in 3 words' }],
          max_tokens: 50
        }),
        signal: AbortSignal.timeout(15000),
      })
      const body = await res.text()
      result.groq = { status: res.status, ok: res.ok, body: body.slice(0, 500) }
    } catch (e: any) {
      result.groq = { error: e.message }
    }
  } else {
    result.groq = { error: 'No GROQ_API_KEY' }
  }

  // 6. Test Gemini (gemini-2.5-flash)
  const gKey = process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  if (gKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${gKey}`,
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
