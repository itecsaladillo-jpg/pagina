import { NextRequest, NextResponse } from 'next/server'
import { buscarFeedbacksSimilares, auditarRespuestaIA } from '@/services/ai'
import { createClient } from '@/lib/supabase/server'
import { getAIPrompt } from '@/services/admin'
import { recuperarContextoRAG } from '@/lib/rag/ragCascade'
import { detectarComandoGuardar, debeAutoGuardar, guardarConversacion } from '@/lib/rag/conversacionesGuardadas'

export const runtime = 'edge'

const SYSTEM_INSTRUCTION = `Sos un asistente de comunicación interna para ITEC Saladillo, 
una organización tecnológica y comunitaria de Saladillo, Buenos Aires.

Tu estilo de escritura es:
- TÉCNICO: usás terminología precisa y profesional
- HUMANO: cálido, cercano, que conecta con las personas
- VANGUARDISTA: dinámico, orientado al futuro, innovador

PALABRAS Y ESTRUCTURAS COMPLETAMENTE PROHIBIDAS (nunca las uses):
- "el ITEC", "la ITEC" (Nombrá a la organización únicamente como "ITEC").
- "viste", "che", "pibe", "hoy", "ayer", "mañana".

En su lugar, usá alternativas como:
- En lugar de "hoy": "esta jornada", "en la sesión actual", "durante este encuentro"
- En lugar de "ayer": "en la sesión anterior", "en el encuentro previo"
- En lugar de "mañana": "en la próxima instancia", "en el siguiente encuentro"
- En lugar de "che": nada, empezá directo con el mensaje
- En lugar de "viste": "como se mencionó", "según lo tratado"
- En lugar de "pibe": nada, usá el nombre o "miembro"

Siempre escribís en español rioplatense formal, con vos y sus conjugaciones correctas.
Nunca utilizás lenguaje informal ni regionalismos fuera de los autorizados.`

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<Response> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
    const err = await response.text().catch(() => 'unknown error')
    throw new Error(`OpenRouter API error: ${response.status} - ${err}`)
  }
  return response
}

async function callHuggingFace(prompt: string): Promise<string> {
  const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HF_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 4096,
        temperature: 0.7,
        return_full_text: false
      }
    })
  })

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown error')
    throw new Error(`HuggingFace API error: ${response.status} - ${err}`)
  }
  const data = await response.json()
  return data?.generated_text || data?.[0]?.generated_text || ''
}

export async function POST(req: NextRequest) {
  let cuerpo: { mensaje?: string; historial?: { role: string; content: string }[]; idioma?: string; sessionId?: string }
  try {
    cuerpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { mensaje, historial = [], sessionId } = cuerpo

  if (!mensaje || typeof mensaje !== 'string') {
    return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
  }

  const errors: string[] = []

  const supabase = await createClient()

  // ── Contexto enriquecido: ejecutar en paralelo todo lo que no depende de RAG ──
  const [
    feedbacksResult,
    miembrosResult,
    notasResult,
    comisionesResult,
    accionesResult,
    promptConfigResult,
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
    getAIPrompt('asistente_global'),
    recuperarContextoRAG(mensaje, supabase, sessionId),
  ])

  // Aprendizajes comunitarios (feedback RAG semántico)
  let aprendizajesAdicionales = ''
  if (feedbacksResult.status === 'fulfilled') {
    const feedbacks = feedbacksResult.value
    if (feedbacks?.length > 0) {
      aprendizajesAdicionales = `\n\n## Aprendizaje Comunitario:\n${feedbacks.map(f => `- ${f.tema_principal} -> ${f.lo_mas_util}`).join('\n')}`
    }
  } else {
    errors.push(`Feedback RAG error: ${feedbacksResult.reason}`)
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
    errors.push(`Miembros error: ${miembrosResult.reason}`)
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
    errors.push(`Notas error: ${notasResult.reason}`)
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
    errors.push(`Comisiones error: ${comisionesResult.reason}`)
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
    errors.push(`Acciones error: ${accionesResult.reason}`)
    console.error('[Asistente] Acciones:', accionesResult.reason)
  }

  // Prompt base (desde Supabase config o fallback local)
  let promptSistema = SYSTEM_INSTRUCTION
  if (promptConfigResult.status === 'fulfilled') {
    if (promptConfigResult.value) promptSistema = promptConfigResult.value.system_prompt
  } else {
    errors.push(`Prompt config error: ${promptConfigResult.reason}`)
    console.warn('[Asistente] Prompt config:', promptConfigResult.reason)
  }

  // Contexto RAG recuperado por la cascada (P1→P2→P3)
  // Se inyecta como texto plano, sin revelar la fuente al LLM.
  let ragContext = ''
  if (ragResult.status === 'fulfilled') {
    const { contexto, nivel } = ragResult.value
    if (contexto) {
      ragContext = `\n\n## Información de contexto relevante:\n${contexto}`
      console.log(`[Asistente] Contexto RAG inyectado (nivel: ${nivel}, ${contexto.length} chars)`)
    }
  } else {
    errors.push(`RAG cascade error: ${ragResult.reason}`)
    console.error('[Asistente] RAG cascade:', ragResult.reason)
  }

  const esComandoGuardar = detectarComandoGuardar(mensaje)
  const esAutoGuardar = debeAutoGuardar(historial.length + 1) // +1 por el mensaje actual

  if (esComandoGuardar) {
    promptSistema += `\n\n[INSTRUCCIÓN DEL SISTEMA]: El usuario solicitó explícitamente guardar esta conversación o usarla como memoria. Confirma de manera breve y natural en tu respuesta que los datos de la charla han quedado registrados como contexto guardado.`
  }

  const messages = [
    { role: 'system', content: promptSistema + ragContext + aprendizajesAdicionales + miembrosContext + notasContext + comisionesContext + accionesContext },
    ...historial.map((m: { role: string; content: string }) => ({
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
      guardado: (esComandoGuardar || esAutoGuardar) ? true : undefined,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('OpenRouter failed, trying HuggingFace fallback:', error)

    try {
      const fallbackPrompt = `${promptSistema}\n\n${ragContext}\n\n${aprendizajesAdicionales}\n\n${miembrosContext}\n\n${notasContext}\n\n${comisionesContext}\n\n${accionesContext}\n\nUsuario: ${mensaje}`
      const respuestaCompleta = await callHuggingFace(fallbackPrompt)
      const resultadoAuditoria = await auditarRespuestaIA(mensaje, respuestaCompleta)

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
        guardado: (esComandoGuardar || esAutoGuardar) ? true : undefined,
        modelo: 'meta-llama/Llama-3.1-8B-Instruct',
        fallback: true
      })
    } catch (fallbackError: any) {
      return NextResponse.json({
        error: error.message || 'Error de IA',
        detalle: fallbackError.message,
        errors
      }, { status: 502 })
    }
  }
}