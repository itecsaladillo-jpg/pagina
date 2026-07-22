export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import { buscarFeedbacksSimilares, auditarRespuestaIA } from '@/services/ai'
import { getAIPrompt } from '@/services/admin'
import { DOCS_CONTEXT } from '@/lib/docsContext'

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

interface MensajeChat {
  role: 'user' | 'model'
  text: string
}

interface CuerpoSolicitud {
  action: 'chat' | 'redactar'
  mensaje?: string
  historial?: MensajeChat[]
  idioma?: string
  datos_crudos?: string
}

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<any> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://itecsaladillo.org.ar',
      'X-Title': 'ITEC Chat'
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

async function callOpenRouter2(prompt: string): Promise<any> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER2_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://itecsaladillo.org.ar',
      'X-Title': 'ITEC Redaccion'
    },
    body: JSON.stringify({
      model: 'tencent/hunyuan-3d-latest',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      temperature: 0.7,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown error')
    throw new Error(`OpenRouter2 API error: ${response.status} - ${err}`)
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

export async function POST(request: Request): Promise<Response> {
  let cuerpo: CuerpoSolicitud
  try {
    cuerpo = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 })
  }

  const { action, mensaje, historial = [], idioma, datos_crudos } = cuerpo

  if (action === 'redactar') {
    if (!datos_crudos || typeof datos_crudos !== 'string') {
      return new Response(JSON.stringify({ error: 'Datos requeridos para redactar' }), { status: 400 })
    }

    const prompt = `Sos un redactor periodístico experto para ITEC Saladillo. Transformá los hechos crudos en un artículo inspirador.
    
    ROL: Periodista social.
    OBJETIVO: Generar orgullo y pertenencia en Saladillo.
    TONO: Aspiracional, accesible y humano.
    ENFOQUE: Traducir la técnica a beneficios comunitarios. Estructura de pirámide invertida. Evitá tecnicismos.
    CIERRE: Frase que invite a sumarse al ecosistema ITEC.
    
    HECHOS CRUDOS:
    """${datos_crudos}"""
    
    Respondés únicamente con el texto del artículo, sin títulos adicionales ni comillas.`

    try {
      const aiResponse = await callOpenRouter2(prompt)
      const data = await aiResponse.json()
      const textoRespuesta = data.choices?.[0]?.message?.content || 'No se generó respuesta'

      return new Response(JSON.stringify({
        respuesta: textoRespuesta,
        modelo: 'tencent/hunyuan-3d-latest'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: any) {
      console.error('OpenRouter2 failed, trying HuggingFace fallback:', error)
      
      try {
        const textoRespuesta = await callHuggingFace(prompt)
        return new Response(JSON.stringify({
          respuesta: textoRespuesta,
          modelo: 'meta-llama/Llama-3.1-8B-Instruct',
          fallback: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (fallbackError: any) {
        return new Response(JSON.stringify({
          error: 'Error procesando la redacción',
          detalle: fallbackError.message
        }), { status: 502 })
      }
    }
  }

  if (action === 'chat') {
    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
      return new Response(JSON.stringify({ error: 'Mensaje requerido' }), { status: 400 })
    }

    let aprendizajesAdicionales = ''
    try {
      const feedbacks = await buscarFeedbacksSimilares(mensaje, 5, 0.35)
      if (feedbacks?.length > 0) {
        aprendizajesAdicionales = `\n\n## Aprendizaje Comunitario:\n${feedbacks.map(f => `- ${f.tema_principal} -> ${f.lo_mas_util}`).join('\n')}`
      }
    } catch (err) { console.error(err) }

    let miembrosContext = ''
    try {
      const supabase = await createClient()
      const { data: miembros } = await supabase.rpc('obtener_miembros_publicos')
      if (miembros?.length > 0) {
        miembrosContext = `\n\n## Staff ITEC:\n${miembros.map((m: any) => `- ${m.full_name}: ${m.role}`).join('\n')}`
      }
    } catch (err) { console.error(err) }

    let promptSistema = SYSTEM_INSTRUCTION
    try {
      const promptConfig = await getAIPrompt('asistente_global')
      if (promptConfig) promptSistema = promptConfig.system_prompt
    } catch (err) { console.warn(err) }

    const instruccionPrioridad = `\n\nPRIORIDAD ABSOLUTA: Para tus respuestas, debes buscar la información de forma prioritaria en la sección "Documentación Institucional de ITEC" proveída más abajo. Basate siempre en esa fuente como verdad principal.
REGLAS ESTRICTAS CONTRA ALUCINACIONES:
- NUNCA afirmes que ITEC "no es un espacio físico". ITEC SÍ cuenta con espacios físicos (Usina del Conocimiento, CURS).
- NUNCA uses la estructura "Nuestra esencia: Técnica... Humana... Vanguardista..." ni digas que ITEC se especializa en "infraestructura de redes".
- Evitá dar descripciones enlatadas incorrectas sobre el "Staff central".`
    const messages = [
      { role: 'system', content: promptSistema + instruccionPrioridad + aprendizajesAdicionales + miembrosContext + '\n\n' + DOCS_CONTEXT },
      ...historial.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text })),
      { role: 'user', content: mensaje }
    ]

    try {
      const aiResponse = await callOpenRouter(messages)
      const data = await aiResponse.json()
      const textoRespuesta = data.choices?.[0]?.message?.content || ''

      const resultadoAuditoria = await auditarRespuestaIA(mensaje, textoRespuesta)
      return new Response(JSON.stringify({
        respuesta: resultadoAuditoria.respuestaFinal,
        modelo: 'deepseek/deepseek-chat'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: any) {
      console.error('OpenRouter failed, trying HuggingFace fallback:', error)

      try {
        const instruccionPrioridad = `\n\nPRIORIDAD ABSOLUTA: Para tus respuestas, debes buscar la información de forma prioritaria en la sección "Documentación Institucional de ITEC" proveída más abajo. Basate siempre en esa fuente como verdad principal.
REGLAS ESTRICTAS CONTRA ALUCINACIONES:
- NUNCA afirmes que ITEC "no es un espacio físico". ITEC SÍ cuenta con espacios físicos (Usina del Conocimiento, CURS).
- NUNCA uses la estructura "Nuestra esencia: Técnica... Humana... Vanguardista..." ni digas que ITEC se especializa en "infraestructura de redes".
- Evitá dar descripciones enlatadas incorrectas sobre el "Staff central".`
        const fallbackPrompt = `${promptSistema}${instruccionPrioridad}\n\n${aprendizajesAdicionales}\n\n${miembrosContext}\n\n${DOCS_CONTEXT}\n\nUsuario: ${mensaje}`
        const respuestaCompleta = await callHuggingFace(fallbackPrompt)
        const resultadoAuditoria = await auditarRespuestaIA(mensaje, respuestaCompleta)

        return new Response(JSON.stringify({
          respuesta: resultadoAuditoria.respuestaFinal,
          modelo: 'meta-llama/Llama-3.1-8B-Instruct',
          fallback: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (fallbackError: any) {
        return new Response(JSON.stringify({
          error: error.message || 'Error de IA',
          detalle: fallbackError.message
        }), { status: 502 })
      }
    }
  }

  return new Response(JSON.stringify({ error: 'Acción inválida' }), { status: 400 })
}