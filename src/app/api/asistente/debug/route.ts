import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    HF_API_KEY: !!process.env.HF_API_KEY,
    GEMINI_API_KEY: !!(process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  // Test: can we read api_settings with service role?
  let apiSettingsTest = 'not tested'
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      const res = await fetch(`${supabaseUrl}/rest/v1/api_settings?select=key,value&limit=20`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const rows = await res.json() as Array<{ key: string; value: string }>
        apiSettingsTest = JSON.stringify(rows.map(r => ({ key: r.key, hasValue: !!r.value && r.value.trim().length > 0 })))
      } else {
        apiSettingsTest = `HTTP ${res.status}: ${await res.text()}`
      }
    } else {
      apiSettingsTest = 'Missing SUPABASE_URL or SERVICE_ROLE_KEY'
    }
  } catch (e: any) {
    apiSettingsTest = `Error: ${e.message}`
  }

  return NextResponse.json({ envCheck, apiSettingsTest })
}
