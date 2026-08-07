import { NextRequest, NextResponse } from 'next/server'
import { buscarFeedbacksSimilares, auditarRespuestaIA } from '@/services/ai'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { recuperarContextoRAG } from '@/lib/rag/ragCascade'
import { detectarComandoGuardar, debeAutoGuardar, guardarConversacion } from '@/lib/rag/conversacionesGuardadas'
import { FALLBACK_PROMPT, ANTI_HALLUCINATION_RULES_FLEXIBLE } from '@/lib/ai/constants'

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://itecsaladillo.org.ar',
      'X-Title': 'ITEC Asistente'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 4096
    })
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

  console.log('[Asistente] Env keys presentes:', {
    OPENROUTER: !!process.env.OPENROUTER_API_KEY,
    HF: !!process.env.HF_API_KEY,
    GEMINI: !!(process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  const supabase = await createClient()

  // ── Contexto enriquecido: ejecutar en paralelo todo lo que no depende de RAG ──
  const [
    feedbacksResult,
    miembrosResult,
    notasResult,
    comisionesResult,
    accionesResult,
    articulosResult,
    ragResult,
  ] = await Promise.allSettled([
    buscarFeedbacksSimilares(mensaje, 5, 0.35),
    supabase.rpc('obtener_miembros_publicos'),
    supabase
      .from('notas_publico')
      .select('titulo, contenido, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('commissions')
      .select('name, description')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('itec_actions')
      .select('title, type, status, start_date, description')
      .in('status', ['planificacion', 'en_curso'])
      .order('start_date', { ascending: true })
      .limit(10),
    supabase
      .from('public_articles')
      .select('title, slug, excerpt, content')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(15),
    recuperarContextoRAG(mensaje, supabase, sessionId),
  ])

  // ── Obtener Prompt Maestro directo de Supabase (sin caché) ──
  let promptSistema = FALLBACK_PROMPT
  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: promptData, error: promptError } = await supabaseAdmin
      .from('ai_prompt_settings')
      .select('system_prompt')
      .eq('clave_prompt', 'asistente_global')
      .maybeSingle()

    if (promptError) {
      console.error("⚠️ ERROR O PROMPT VACÍO AL LEER DE SUPABASE. Revisar RLS o clave.", promptError.message)
    } else if (promptData?.system_prompt) {
      promptSistema = promptData.system_prompt
    } else {
      console.error("⚠️ ERROR O PROMPT VACÍO AL LEER DE SUPABASE. Revisar RLS o clave.")
    }
  } catch (e) {
    console.error("⚠️ ERROR O PROMPT VACÍO AL LEER DE SUPABASE. Revisar RLS o clave.", e)
  }

  // Aprendizajes comunitarios (feedback RAG semántico)
  let aprendizajesAdicionales = ''
  if (feedbacksResult.status === 'fulfilled') {
    const feedbacks = feedbacksResult.value
    if (feedbacks?.length > 0) {
      aprendizajesAdicionales = `\n\n## Aprendizaje Comunitario:\n${feedbacks.map(f => `- ${f.tema_principal} -> ${f.lo_mas_util}`).join('\n')}`
    }
  } else {
    console.error('[Asistente] Feedback RAG:', feedbacksResult.reason)
  }

  // Staff ITEC
  let miembrosContext = ''
  if (miembrosResult.status === 'fulfilled') {
    const miembros = miembrosResult.value?.data
    if (miembros?.length > 0) {
      miembrosContext = `\n\n## Staff ITEC:\n${miembros.map((m: any) => `- ${m.full_name}: ${m.role}`).join('\n')}`
    }
  } else {
    console.error('[Asistente] Miembros:', miembrosResult.reason)
  }

  // Noticias recientes
  let notasContext = ''
  if (notasResult.status === 'fulfilled') {
    const notas = notasResult.value?.data
    if (notas && notas.length > 0) {
      notasContext = `\n\n## Noticias Recientes de ITEC:\n${notas.map((n: any) => {
        const fecha = n.created_at?.split('T')[0] ?? ''
        const preview = n.contenido.length > 250 ? n.contenido.slice(0, 250) + '…' : n.contenido
        return `- [${fecha}] ${n.titulo}: ${preview}`
      }).join('\n')}`
    }
  } else {
    console.error('[Asistente] Notas:', notasResult.reason)
  }

  // Comisiones
  let comisionesContext = ''
  if (comisionesResult.status === 'fulfilled') {
    const comisiones = comisionesResult.value?.data
    if (comisiones && comisiones.length > 0) {
      comisionesContext = `\n\n## Comisiones / Áreas de ITEC:\n${comisiones.map((c: any) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')}`
    }
  } else {
    console.error('[Asistente] Comisiones:', comisionesResult.reason)
  }

  // Actividades y Eventos
  let accionesContext = ''
  if (accionesResult.status === 'fulfilled') {
    const acciones = accionesResult.value?.data
    if (acciones && acciones.length > 0) {
      accionesContext = `\n\n## Próximas actividades / Eventos:\n${acciones.map((a: any) => {
        const fecha = a.start_date ? a.start_date.split('T')[0] : 'fecha a confirmar'
        return `- [${a.type}] ${a.title} (${fecha})${a.description ? ` — ${a.description.slice(0, 200)}` : ''}`
      }).join('\n')}`
    }
  } else {
    console.error('[Asistente] Acciones:', accionesResult.reason)
  }

  // Artículos publicados (para responder consultas que no están en RAG)
  let articulosContext = ''
  if (articulosResult.status === 'fulfilled') {
    const articulos = articulosResult.value?.data
    if (articulos && articulos.length > 0) {
      articulosContext = `\n\n## Artículos Publicados en ITEC:\n${articulos.map((a: any) => {
        const preview = a.excerpt || (a.content ? a.content.slice(0, 200) + '…' : '')
        return `- "${a.title}" (${a.slug}): ${preview}`
      }).join('\n')}`
    }
  } else {
    console.error('[Asistente] Artículos:', articulosResult.reason)
  }

  // Contexto RAG recuperado por la cascada (P1→P2→P3)
  let ragContext = ''
  if (ragResult.status === 'fulfilled') {
    const { contexto, nivel } = ragResult.value
    if (contexto) {
      ragContext = `\n\n<retrieved_context>\n${contexto}\n</retrieved_context>`
    }
  } else {
    console.error('[Asistente] RAG cascade:', ragResult.reason)
  }

  const esComandoGuardar = detectarComandoGuardar(mensaje)
  const esAutoGuardar = debeAutoGuardar(historial.length + 1) // +1 por el mensaje actual

  if (esComandoGuardar) {
    promptSistema += `\n\n[INSTRUCCIÓN DEL SISTEMA]: El usuario solicitó explícitamente guardar esta conversación o usarla como memoria. Confirma de manera breve y natural en tu respuesta que los datos de la charla han quedado registrados como contexto guardado.`
  }

  const messages = [
    { role: 'system', content: `${promptSistema}\n\n${ANTI_HALLUCINATION_RULES_FLEXIBLE}${ragContext}\n${aprendizajesAdicionales}${miembrosContext}${notasContext}${comisionesContext}${accionesContext}${articulosContext}` },
    ...historial
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content
      })),
    { role: 'user', content: mensaje }
  ]

  try {
    const aiResponse = await callOpenRouter(messages)
    const data = await aiResponse.json()
    const textoRespuesta = data.choices?.[0]?.message?.content || ''

    const resultadoAuditoria = await auditarRespuestaIA(mensaje, textoRespuesta)

    // Fire and forget persistencia
    if (sessionId && (esComandoGuardar || esAutoGuardar)) {
      const historialCompleto = [
        ...historial,
        { role: 'user', content: mensaje },
        { role: 'model', content: resultadoAuditoria.respuestaFinal }
      ]
      guardarConversacion(historialCompleto, sessionId, supabase, esComandoGuardar).catch(e => 
        console.error('[Asistente] Error en fire-and-forget de guardarConversacion:', e)
      )
    }

    return NextResponse.json({ 
      respuesta: resultadoAuditoria.respuestaFinal,
      guardado: (esComandoGuardar || esAutoGuardar) ? true : undefined
    })
  } catch (error: any) {
    console.error('[Asistente] OpenRouter failed:', error?.message)

    // Fallback 2: Gemini
    try {
      const geminiText = await callGemini(mensaje, messages[0].content)
      if (!geminiText) throw new Error('Gemini empty response')

      const resultadoAuditoria = await auditarRespuestaIA(mensaje, geminiText)
      return NextResponse.json({
        respuesta: resultadoAuditoria.respuestaFinal,
        guardado: (esComandoGuardar || esAutoGuardar) ? true : undefined,
        modelo: 'gemini-2.0-flash',
        fallback: true
      })
    } catch (geminiError: any) {
      console.error('[Asistente] Gemini also failed:', geminiError?.message)
    }

    return NextResponse.json({
      error: 'Error al conectar con el servicio de IA'
    }, { status: 502 })
  }
}