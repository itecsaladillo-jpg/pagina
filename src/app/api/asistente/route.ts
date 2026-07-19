import { NextRequest, NextResponse } from 'next/server'
import { buscarFeedbacksSimilares, auditarRespuestaIA } from '@/services/ai'
import { createClient } from '@/lib/supabase/server'
import { getAIPrompt } from '@/services/admin'

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
      model: 'meta-llama/llama-3.1-8b-instruct:free',
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
  let cuerpo: { mensaje?: string; historial?: { role: string; content: string }[]; idioma?: string }
  try {
    cuerpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { mensaje, historial = [] } = cuerpo

  if (!mensaje || typeof mensaje !== 'string') {
    return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
  }

  const errors: string[] = []

  let aprendizajesAdicionales = ''
  try {
    const feedbacks = await buscarFeedbacksSimilares(mensaje, 5, 0.35)
    if (feedbacks?.length > 0) {
      aprendizajesAdicionales = `\n\n## Aprendizaje Comunitario:\n${feedbacks.map(f => `- ${f.tema_principal} -> ${f.lo_mas_util}`).join('\n')}`
    }
  } catch (err) { 
    errors.push(`RAG error: ${err instanceof Error ? err.message : String(err)}`)
    console.error(err) 
  }

  let miembrosContext = ''
  try {
    const supabase = await createClient()
    const { data: miembros } = await supabase.rpc('obtener_miembros_publicos')
    if (miembros?.length > 0) {
      miembrosContext = `\n\n## Staff ITEC:\n${miembros.map((m: any) => `- ${m.full_name}: ${m.role}`).join('\n')}`
    }
  } catch (err) { 
    errors.push(`Miembros error: ${err instanceof Error ? err.message : String(err)}`)
    console.error(err) 
  }

  let promptSistema = SYSTEM_INSTRUCTION
  try {
    const promptConfig = await getAIPrompt('asistente_global')
    if (promptConfig) promptSistema = promptConfig.system_prompt
  } catch (err) { 
    errors.push(`Prompt error: ${err instanceof Error ? err.message : String(err)}`)
    console.warn(err) 
  }

  const messages = [
    { role: 'system', content: promptSistema + aprendizajesAdicionales + miembrosContext },
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
    return NextResponse.json({ 
      respuesta: resultadoAuditoria.respuestaFinal,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('OpenRouter failed, trying HuggingFace fallback:', error)

    try {
      const fallbackPrompt = `${promptSistema}\n\n${aprendizajesAdicionales}\n\n${miembrosContext}\n\nUsuario: ${mensaje}`
      const respuestaCompleta = await callHuggingFace(fallbackPrompt)
      const resultadoAuditoria = await auditarRespuestaIA(mensaje, respuestaCompleta)

      return NextResponse.json({
        respuesta: resultadoAuditoria.respuestaFinal,
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