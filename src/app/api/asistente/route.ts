import { NextRequest, NextResponse } from 'next/server'
import { auditarRespuestaIA } from '@/services/ai'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { detectarComandoGuardar, debeAutoGuardar } from '@/lib/rag/conversacionesGuardadas'
import { recuperarContextoRAG } from '@/lib/rag/ragCascade'
import { FALLBACK_PROMPT, ANTI_HALLUCINATION_RULES_FLEXIBLE } from '@/lib/ai/constants'

export const maxDuration = 60

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
  console.log(`[Asistente] OpenRouter: ${messages.length} msgs, ${totalChars} chars`)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://itecsaladillo.org.ar',
      'X-Title': 'ITEC Asistente'
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-nano-9b-v2:free',
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 4096
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'no body')
    console.error(`[Asistente] OpenRouter ${response.status}:`, errorBody.slice(0, 500))
    throw new Error(`OpenRouter ${response.status}`)
  }
  return response
}

async function callGemini(mensaje: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  if (!apiKey) throw new Error('No Gemini API key')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: mensaje }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    signal: AbortSignal.timeout(25000),
    }
  )

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error(`[Asistente] Gemini ${res.status}:`, err.slice(0, 500))
    throw new Error(`Gemini ${res.status}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function POST(req: NextRequest) {
  let cuerpo: { mensaje?: string; historial?: { role: string; content: string }[]; idioma?: string; sessionId?: string }
  try {
    cuerpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { mensaje, historial = [], sessionId: clientSessionId } = cuerpo
  const sessionId = clientSessionId || crypto.randomUUID()

  if (!mensaje || typeof mensaje !== 'string') {
    return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
  }

  // Paso 1: Probar OpenRouter directo antes de todo lo demás
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error('[Asistente] OPENROUTER_API_KEY no definida')
    return NextResponse.json({ error: 'API key no configurada', detail: 'OPENROUTER_API_KEY missing' }, { status: 500 })
  }

  // Construir un system prompt mínimo funcional
  let promptSistema = FALLBACK_PROMPT

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const hasSupabase = !!supabaseUrl && !!serviceKey

  // Paso 2: Contexto enriquecido (con admin client, sin cookies)
  if (hasSupabase) {
    try {
      const adminClient = createSupabaseClient(supabaseUrl, serviceKey)

      const [
        promptResult,
        miembrosResult,
        notasResult,
        comisionesResult,
        accionesResult,
        articulosResult,
        ragResult,
      ] = await Promise.allSettled([
        adminClient.from('ai_prompt_settings').select('system_prompt').eq('clave_prompt', 'asistente_global').maybeSingle(),
        adminClient.rpc('obtener_miembros_publicos'),
        adminClient.from('notas_publico').select('titulo, contenido, created_at').eq('is_published', true).order('created_at', { ascending: false }).limit(10),
        adminClient.from('commissions').select('name, description').eq('is_active', true).order('name'),
        adminClient.from('itec_actions').select('title, type, status, start_date, description').in('status', ['planificacion', 'en_curso']).order('start_date', { ascending: true }).limit(10),
        adminClient.from('public_articles').select('title, slug, excerpt, content').eq('is_published', true).order('created_at', { ascending: false }).limit(15),
        recuperarContextoRAG(mensaje, adminClient, sessionId),
      ])

      if (promptResult.status === 'fulfilled' && promptResult.value.data?.system_prompt) {
        promptSistema = promptResult.value.data.system_prompt
      }

      const miembrosContext = miembrosResult.status === 'fulfilled' && (miembrosResult.value.data as any[])?.length
        ? `\n\n## Staff ITEC:\n${(miembrosResult.value.data as any[]).map((m: any) => `- ${m.full_name}: ${m.role}`).join('\n')}` : ''

      const notasContext = notasResult.status === 'fulfilled' && notasResult.value.data?.length
        ? `\n\n## Noticias Recientes:\n${notasResult.value.data.map((n: any) => `- ${n.titulo}: ${(n.contenido || '').slice(0, 200)}`).join('\n')}` : ''

      const comisionesContext = comisionesResult.status === 'fulfilled' && comisionesResult.value.data?.length
        ? `\n\n## Comisiones:\n${comisionesResult.value.data.map((c: any) => `- ${c.name}`).join('\n')}` : ''

      const accionesContext = accionesResult.status === 'fulfilled' && accionesResult.value.data?.length
        ? `\n\n## Próximas actividades:\n${accionesResult.value.data.map((a: any) => `- ${a.title} (${a.type})`).join('\n')}` : ''

      const articulosContext = articulosResult.status === 'fulfilled' && articulosResult.value.data?.length
        ? `\n\n## Artículos:\n${articulosResult.value.data.map((a: any) => `- "${a.title}": ${(a.excerpt || '').slice(0, 150)}`).join('\n')}` : ''

      promptSistema += `\n\n${ANTI_HALLUCINATION_RULES_FLEXIBLE}${miembrosContext}${notasContext}${comisionesContext}${accionesContext}${articulosContext}`

      // RAG ya ejecutado en paralelo con las queries
      if (ragResult.status === 'fulfilled' && ragResult.value.contexto) {
        promptSistema += `\n\n## Contexto recuperado por RAG (nivel: ${ragResult.value.nivel}, score: ${ragResult.value.score.toFixed(2)}):\n${ragResult.value.contexto}`
        console.log(`[Asistente] RAG: nivel=${ragResult.value.nivel}, score=${ragResult.value.score.toFixed(3)}`)
      } else if (ragResult.status === 'rejected') {
        console.error('[Asistente] Error en RAG cascade:', ragResult.reason?.message)
      } else {
        console.log('[Asistente] RAG: sin contexto recuperado')
      }
    } catch (e: any) {
      console.error('[Asistente] Error cargando contexto:', e?.message)
    }
  }

  // Limitar el system prompt (preservar prompt maestro de DB completo)
  const MAX_PROMPT_CHARS = 10000
  if (promptSistema.length > MAX_PROMPT_CHARS) {
    // Preservar los primeros 7000 chars (prompt maestro) y truncar contexto después
    const partePrompt = promptSistema.slice(0, 7000)
    const parteContexto = promptSistema.slice(7000, MAX_PROMPT_CHARS)
    promptSistema = partePrompt + parteContexto + '\n\n[Contexto adicional truncado]'
  }
  console.log(`[Asistente] Prompt final: ${promptSistema.length} chars, historial: ${historial.length} msgs`)

  // Limitar historial a últimos 10 mensajes para no exceder tokens
  const historialLimitado = historial
    .filter((m: { role: string }) => m.role !== 'system')
    .slice(-10)
    .map((m: { role: string; content: string }) => ({
      role: m.role === 'model' ? 'assistant' as const : m.role as 'user' | 'assistant',
      content: m.content.slice(0, 500)
    }))

  const messages = [
    { role: 'system', content: promptSistema },
    ...historialLimitado,
    { role: 'user', content: mensaje }
  ]

  // Paso 3: Llamar a OpenRouter
  try {
    const aiResponse = await callOpenRouter(messages)
    const data = await aiResponse.json()
    const textoRespuesta = data.choices?.[0]?.message?.content || ''

    // Filtrar respuestas que son metadata de seguridad en vez de respuesta real
    const respLimpia = textoRespuesta.trim()
    const esMetadataSeguridad = /^(User Safety|Response Safety|Safety|safe|unsafe|Content [Aa]nalysis)/i.test(respLimpia)
    const esMuyCorta = respLimpia.length < 10

    if (!textoRespuesta || esMetadataSeguridad || esMuyCorta) {
      console.error('[Asistente] OpenRouter devolvió respuesta inválida:', respLimpia.slice(0, 200))
      throw new Error('Invalid response from OpenRouter')
    }

    const resultadoAuditoria = await auditarRespuestaIA(mensaje, textoRespuesta)

    return NextResponse.json({
      respuesta: resultadoAuditoria.respuestaFinal,
      guardado: detectarComandoGuardar(mensaje) || debeAutoGuardar(historial.length + 1) ? true : undefined
    })
  } catch (error: any) {
    console.error('[Asistente] OpenRouter FAILED:', error?.message)

    // Fallback: Gemini
    try {
      const geminiText = await callGemini(mensaje, messages[0].content)
      if (!geminiText) throw new Error('Gemini empty response')

      const resultadoAuditoria = await auditarRespuestaIA(mensaje, geminiText)
      return NextResponse.json({
        respuesta: resultadoAuditoria.respuestaFinal,
        modelo: 'gemini-2.0-flash',
        fallback: true
      })
    } catch (geminiError: any) {
      console.error('[Asistente] Gemini FAILED:', geminiError?.message)
      return NextResponse.json({
        error: 'Todos los providers fallaron',
        openrouter: error?.message,
        gemini: geminiError?.message,
      }, { status: 502 })
    }
  }
}