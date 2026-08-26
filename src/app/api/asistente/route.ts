import { NextRequest, NextResponse } from 'next/server'
import { auditarRespuestaIA } from '@/services/ai'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { detectarComandoGuardar, debeAutoGuardar, guardarConversacion } from '@/lib/rag/conversacionesGuardadas'
import { recuperarContextoRAG } from '@/lib/rag/ragCascade'
import { FALLBACK_PROMPT, POLITICA_RESPUESTA_INTEGRAL } from '@/lib/ai/constants'

export const maxDuration = 60

const GROQ_MODEL = 'openai/gpt-oss-120b'

/** Error de provider con status HTTP para detectar fallos permanentes. */
type ErrorProvider = Error & { status?: number }

function errorProvider(mensaje: string, status?: number): ErrorProvider {
  const err = new Error(mensaje) as ErrorProvider
  err.status = status
  return err
}

/**
 * Valida el texto de una respuesta de IA. Lanza error si viene vacía,
 * es metadata de seguridad o es demasiado corta (cuenta como intento fallido).
 */
function validarTextoRespuesta(texto: string, provider: string): string {
  const limpio = (texto || '').trim()
  const esMetadataSeguridad = /^(User Safety|Response Safety|Safety|safe|unsafe|Content [Aa]nalysis)/i.test(limpio)
  if (!limpio || esMetadataSeguridad || limpio.length < 10) {
    console.error(`[Asistente] ${provider} respuesta inválida:`, limpio.slice(0, 200))
    throw errorProvider(`Invalid response from ${provider}`)
  }
  return limpio
}

async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw errorProvider('GROQ_API_KEY not set')

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
  console.log(`[Asistente] Groq (${GROQ_MODEL}): ${messages.length} msgs, ${totalChars} chars`)

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 2048
    }),
    signal: AbortSignal.timeout(13000),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'no body')
    console.error(`[Asistente] Groq ${response.status}:`, errorBody.slice(0, 400))
    throw errorProvider(`Groq ${response.status}`, response.status)
  }

  const data = await response.json()
  return validarTextoRespuesta(data.choices?.[0]?.message?.content || '', 'Groq')
}

const OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw errorProvider('OPENROUTER_API_KEY not set')

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
  console.log(`[Asistente] OpenRouter (fallback) (${OPENROUTER_MODEL}): ${messages.length} msgs, ${totalChars} chars`)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://itecsaladillo.org.ar',
      'X-Title': 'ITEC Asistente'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 2048
    }),
    signal: AbortSignal.timeout(13000),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'no body')
    console.error(`[Asistente] OpenRouter ${response.status}:`, errorBody.slice(0, 400))
    throw errorProvider(`OpenRouter ${response.status}`, response.status)
  }

  const data = await response.json()
  return validarTextoRespuesta(data.choices?.[0]?.message?.content || '', 'OpenRouter')
}

const GEMINI_MODEL = 'gemini-flash-latest'

async function callGemini(messages: { role: string; content: string }[], timeoutMs: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw errorProvider('No Gemini key configured')

  const systemInstruction = messages.find(m => m.role === 'system')?.content
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  console.log(`[Asistente] Gemini (último recurso) (${GEMINI_MODEL}): ${contents.length} contenidos`)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemInstruction ? { system_instruction: { parts: [{ text: systemInstruction }] } } : {}),
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'no body')
    console.error(`[Asistente] Gemini ${response.status}:`, errorBody.slice(0, 400))
    throw errorProvider(`Gemini ${response.status}`, response.status)
  }

  const data = await response.json()
  const texto = (data.candidates?.[0]?.content?.parts || [])
    .map((p: { text?: string }) => p.text || '')
    .join('')

  return validarTextoRespuesta(texto, 'Gemini')
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

  // Verificar que al menos una API key esté configurada
  const groqKey = process.env.GROQ_API_KEY
  const orKey = process.env.OPENROUTER_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!groqKey && !orKey && !geminiKey) {
    console.error('[Asistente] Ninguna API key configurada (GROQ, OPENROUTER ni Gemini)')
    return NextResponse.json({ error: 'API keys no configuradas' }, { status: 500 })
  }

  // Construir un system prompt mínimo funcional
  let promptSistema = FALLBACK_PROMPT
  let contextoAcumulado = ''

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const hasSupabase = !!supabaseUrl && !!serviceKey

  // Contexto enriquecido (con admin client, sin cookies)
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
        ? `\n\n## Noticias Recientes:\n${notasResult.value.data.map((n: any) => `- ${n.titulo}: ${(n.contenido || '').slice(0, 300)}`).join('\n')}` : ''

      const comisionesContext = comisionesResult.status === 'fulfilled' && comisionesResult.value.data?.length
        ? `\n\n## Comisiones:\n${comisionesResult.value.data.map((c: any) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')}` : ''

      const accionesContext = accionesResult.status === 'fulfilled' && accionesResult.value.data?.length
        ? `\n\n## Próximas actividades:\n${accionesResult.value.data.map((a: any) => `- ${a.title} (${a.type})${a.start_date ? `, inicio: ${a.start_date}` : ''}: ${(a.description || '').slice(0, 150)}`).join('\n')}` : ''

      const articulosContext = articulosResult.status === 'fulfilled' && articulosResult.value.data?.length
        ? `\n\n## Artículos Publicados en ITEC:\n${articulosResult.value.data.map((a: any) => `- "${a.title}": ${(a.excerpt || a.content || '').slice(0, 250)}`).join('\n')}` : ''

      // ── Ensamblado priorizado: RAG PRIMERO (más relevante para la query),
      // luego contexto vivo de la DB. NUNCA se trunca este bloque. ──
      const bloques: string[] = []

      if (ragResult.status === 'fulfilled' && ragResult.value.contexto) {
        bloques.push(`## Información recuperada para esta consulta:\n${ragResult.value.contexto}`)
        console.log(`[Asistente] RAG: nivel=${ragResult.value.nivel}, score=${ragResult.value.score.toFixed(3)}, chars=${ragResult.value.contexto.length}`)
      } else if (ragResult.status === 'rejected') {
        console.error('[Asistente] Error en RAG cascade:', ragResult.reason?.message)
      } else {
        console.log('[Asistente] RAG: sin contexto recuperado')
      }

      for (const b of [notasContext, accionesContext, articulosContext, miembrosContext, comisionesContext]) {
        if (b) bloques.push(b.trimStart())
      }

      contextoAcumulado = bloques.join('\n\n')
    } catch (e: any) {
      console.error('[Asistente] Error cargando contexto:', e?.message)
    }
  }

  // ── Presupuesto de prompt con contextos protegidos (ago 2026) ──
  // El prompt maestro (DB o FALLBACK_PROMPT) se trunca SI hace falta,
  // pero el contexto acumulado (RAG + DB) y la política de respuesta
  // van SIEMPRE completos. Antes el corte fijo en 10000 chars eliminaba
  // el RAG (que iba último), causando negativas del asistente.
  const MAX_PROMPT_CHARS = 18000
  const REGLAS_FINALES = POLITICA_RESPUESTA_INTEGRAL
  let promptFinal = promptSistema

  const presupuestoFijo = contextoAcumulado.length + REGLAS_FINALES.length + 60
  if (promptFinal.length + presupuestoFijo > MAX_PROMPT_CHARS) {
    const disponibleMaestro = Math.max(3500, MAX_PROMPT_CHARS - presupuestoFijo)
    promptFinal = promptFinal.slice(0, disponibleMaestro).trimEnd() + '\n[...]'
    console.warn(`[Asistente] Prompt maestro truncado a ${disponibleMaestro} chars para preservar contexto completo (${contextoAcumulado.length} chars)`)
  }

  promptSistema = `${promptFinal}\n\n${contextoAcumulado}\n\n${REGLAS_FINALES}`
  console.log(`[Asistente] Prompt final: ${promptSistema.length} chars (maestro ${promptFinal.length} + contexto ${contextoAcumulado.length} + política ${REGLAS_FINALES.length}), historial: ${historial.length} msgs`)

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

  // ── Cadena de providers con reintentos automáticos (ago 2026) ──
  // Presupuesto total de ~48s dentro del maxDuration 60 (el resto lo consumen
  // RAG/contexto/auditoría). Se recorren los providers en pasada tras pasada
  // hasta agotar presupuesto: los fallos transitorios (429/5xx/timeouts) se
  // reintenta en la siguiente pasada; los permanentes (401/404/413) deshabilitan
  // al provider para el resto del request.
  const DEADLINE_MS = 48000
  const BACKOFF_MS = 1200
  const MIN_PRESUPUESTO_INTENTO = 3000
  const ESTADOS_PERMANENTES = new Set([400, 401, 403, 404, 413])

  interface ProveedorIA {
    nombre: string
    modelo: string
    timeoutMs: number
    disponible: () => boolean
    ejecutar: (timeoutMs: number) => Promise<string>
  }

  const proveedores: ProveedorIA[] = [
    {
      nombre: 'groq',
      modelo: GROQ_MODEL,
      timeoutMs: 13000,
      disponible: () => !!process.env.GROQ_API_KEY,
      ejecutar: () => callGroq(messages),
    },
    {
      nombre: 'openrouter',
      modelo: OPENROUTER_MODEL,
      timeoutMs: 13000,
      disponible: () => !!process.env.OPENROUTER_API_KEY,
      ejecutar: () => callOpenRouter(messages),
    },
    {
      nombre: 'gemini',
      modelo: GEMINI_MODEL,
      timeoutMs: 18000,
      disponible: () => !!(process.env.GEMINI_API_KEY || process.env.GEMINI_APY_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      ejecutar: (timeoutMs) => callGemini(messages, timeoutMs),
    },
  ]

  const esperar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  let textoRespuesta = ''
  let modeloUsado = ''
  let pasadaExitosa = 0
  const erroresFinales: Record<string, string> = {}
  const deshabilitados = new Set<string>()
  const inicio = Date.now()
  let pasada = 0
  let intentosTotales = 0

  while (Date.now() - inicio < DEADLINE_MS && !textoRespuesta) {
    pasada++
    let intentosEnPasada = 0

    for (const proveedor of proveedores) {
      if (textoRespuesta) break
      if (deshabilitados.has(proveedor.nombre)) continue

      if (!proveedor.disponible()) {
        deshabilitados.add(proveedor.nombre)
        erroresFinales[proveedor.nombre] = 'sin API key configurada'
        continue
      }

      const restante = DEADLINE_MS - (Date.now() - inicio)
      if (restante < MIN_PRESUPUESTO_INTENTO) break
      const timeoutIntento = Math.min(proveedor.timeoutMs, restante)

      intentosTotales++
      intentosEnPasada++
      try {
        console.log(`[Asistente] Intento ${intentosTotales} → ${proveedor.nombre} (pasada ${pasada}, timeout ${timeoutIntento}ms)`)
        textoRespuesta = await proveedor.ejecutar(timeoutIntento)
        modeloUsado = proveedor.modelo
        pasadaExitosa = pasada
      } catch (errAny: any) {
        const err = errAny as ErrorProvider
        erroresFinales[proveedor.nombre] = err?.message || 'error desconocido'
        console.error(`[Asistente] ${proveedor.nombre} FAILED (pasada ${pasada}):`, err?.message)
        if (err?.status && ESTADOS_PERMANENTES.has(err.status)) {
          deshabilitados.add(proveedor.nombre)
          console.warn(`[Asistente] ${proveedor.nombre} deshabilitado por error permanente (${err.status})`)
        }
        await esperar(BACKOFF_MS)
      }
    }

    // Si la pasada no pudo intentar nada (todo deshabilitado o sin presupuesto), cortar.
    if (intentosEnPasada === 0 && !textoRespuesta) {
      pasada--
      break
    }
  }

  if (!textoRespuesta) {
    console.error(`[Asistente] Todos los providers fallaron tras ${intentosTotales} intentos en ${pasada} pasadas (${Date.now() - inicio}ms)`)
    return NextResponse.json({
      error: 'Todos los providers fallaron',
      intentos: intentosTotales,
      pasadas: pasada,
      ...erroresFinales,
    }, { status: 502 })
  }

  console.log(`[Asistente] Éxito vía ${modeloUsado} en pasada ${pasadaExitosa} (intento ${intentosTotales}, ${Date.now() - inicio}ms)`)

  // ── Persistencia real de conversaciones (ago 2026) ──
  // Antes el flag `guardado` se marcaba pero NADIE persistía nada: la función
  // guardarConversacion() nunca era llamada y el nivel P4 del RAG quedaba
  // siempre vacío. Ahora se persiste (con embedding) cuando hay comando
  // explícito o al alcanzar el umbral de auto-guardado.
  const debeGuardar = detectarComandoGuardar(mensaje) || debeAutoGuardar(historial.length + 1)
  if (debeGuardar && hasSupabase) {
    try {
      const adminClient = createSupabaseClient(supabaseUrl, serviceKey)
      await guardarConversacion(
        [...historial, { role: 'user', content: mensaje }, { role: 'assistant', content: textoRespuesta }],
        sessionId,
        adminClient,
        detectarComandoGuardar(mensaje)
      )
    } catch (e: any) {
      console.error('[Asistente] Error guardando conversación:', e?.message)
    }
  }

  const resultadoAuditoria = await auditarRespuestaIA(mensaje, textoRespuesta)
  if (resultadoAuditoria.tieneViolacion) {
    console.warn('[Asistente] Auditoría: VIOLACIÓN — respuesta reemplazada')
  }

  return NextResponse.json({
    respuesta: resultadoAuditoria.respuestaFinal,
    modelo: modeloUsado,
    fallback: pasadaExitosa > 1 || modeloUsado !== GROQ_MODEL ? true : undefined,
    guardado: detectarComandoGuardar(mensaje) || debeAutoGuardar(historial.length + 1) ? true : undefined
  })
}
