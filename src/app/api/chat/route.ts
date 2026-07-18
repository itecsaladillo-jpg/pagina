export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import { buscarFeedbacksSimilares, auditarRespuestaIA } from '@/services/ai'
import { getAIPrompt } from '@/services/admin'

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
  role: 'user' | 'model';
  text: string;
}

interface CuerpoSolicitud {
  action: 'chat' | 'redactar';
  mensaje?: string;
  historial?: MensajeChat[];
  idioma?: string;
  datos_crudos?: string;
}

function limpiarJSON(texto: string): string {
  const jsonMatch = texto.match(/\{[\s\S]*"[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function callGroq(messages: { role: string; content: string }[], stream = false): Promise<any> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`)
  }

  return response
}

async function callGemini(prompt: string, stream = false): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
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
    throw new Error(`HuggingFace API error: ${response.status}`)
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
      const geminiResponse = await callGemini(prompt, false)
      const data = await geminiResponse.json()
      const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se generó respuesta'

      return new Response(JSON.stringify({
        respuesta: textoRespuesta,
        modelo: 'gemini-1.5-flash'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: any) {
      console.error('Gemini failed, trying HuggingFace fallback:', error)
      
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

    const messages = [
      { role: 'system', content: promptSistema + aprendizajesAdicionales + miembrosContext },
      ...historial.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text })),
      { role: 'user', content: mensaje }
    ]

    try {
      const groqResponse = await callGroq(messages, true)
      
      const stream = new ReadableStream({
        async pull(controller) {
          const reader = groqResponse.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }

          const respuestaChunks: string[] = []

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6)
                if (jsonStr === '[DONE]') continue

                try {
                  const json = JSON.parse(jsonStr)
                  const delta = json.choices?.[0]?.delta?.content || ''
                  if (delta) {
                    respuestaChunks.push(delta)
                    controller.enqueue(new TextEncoder().encode(delta))
                  }
                } catch {}
              }
            }
          }

          controller.close()
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      })
    } catch (error: any) {
      console.error('Groq failed, trying HuggingFace fallback:', error)

      try {
        const fallbackPrompt = `${promptSistema}\n\n${aprendizajesAdicionales}\n\n${miembrosContext}\n\nUsuario: ${mensaje}`
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
          error: error.name === 'AbortError' ? 'La IA tardó demasiado en responder' : error.message,
          detalle: fallbackError.message
        }), { status: 502 })
      }
    }
  }

  return new Response(JSON.stringify({ error: 'Acción inválida' }), { status: 400 })
}