import { createClient } from '@/lib/supabase/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_API_BASE_URL || 'https://ai.itecsaladillo.org.ar'
const OLLAMA_MODEL = 'llama3.2:latest'

async function chatWithOllama(messages: { role: string; content: string }[], temperature = 0.7, options?: { num_ctx?: number; timeout?: number }): Promise<string> {
  const timeout = options?.timeout ?? 98000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        temperature,
        options: { num_ctx: options?.num_ctx ?? 2048 },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Error en Ollama: ${response.status}${text ? ` - ${text}` : ''}`)
    }

    const data = await response.json()
    return data.message?.content || ''
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Error en Ollama: 524 - Timeout después de ${timeout}ms`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Prompt de sistema — Estilo ITEC
 * Técnico, Humano, Vanguardista.
 * Palabras prohibidas: viste, che, pibe, hoy, ayer, mañana
 */
const ITEC_SYSTEM_PROMPT = `
Sos un asistente de comunicación interna para ITEC Saladillo, 
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
Nunca utilizás lenguaje informal ni regionalismos fuera de los autorizados.
`

export interface AIProcessResult {
  summary: string
  action_items: string[]
}

export async function processWithAI(
  text: string,
  sourceType: 'meet' | 'capacitacion' | 'reunion' | 'manual',
  commissionName?: string
): Promise<AIProcessResult> {
  const contextLabel = {
    meet: 'transcripción de una reunión virtual de Google Meet',
    capacitacion: 'descripción de una capacitación',
    reunion: 'acta de reunión presencial',
    manual: 'texto de comunicación interna',
  }[sourceType]

  const commissionContext = commissionName
    ? `La información pertenece a la Comisión de ${commissionName}.`
    : ''

  const userPrompt = `Se te entrega la ${contextLabel} de ITEC Saladillo.
${commissionContext}

TEXTO A PROCESAR:
"""
${text}
"""

Generá exactamente dos elementos en formato JSON puro (sin markdown, sin bloques de código):

{
  "summary": "Resumen ejecutivo de 3-5 oraciones, capturando los puntos principales tratados.",
  "action_items": [
    "Tarea concreta 1 con responsable si se menciona",
    "Tarea concreta 2",
    "..."
  ]
}

Respondés ÚNICAMENTE con el JSON, sin ningún texto adicional antes o después.`

  const raw = await chatWithOllama([
    { role: 'system', content: ITEC_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ])

  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

  const parsed = JSON.parse(cleaned) as AIProcessResult
  return parsed
}

export async function generateFlash(text: string): Promise<string> {
  const userPrompt = `Con base en el siguiente texto, redactá un Flash Informativo de máximo 2 oraciones 
para el muro interno de ITEC. Dinámico, motivador, en Estilo ITEC.
Respondé únicamente con el texto del flash, sin comillas ni etiquetas.

TEXTO:
"""
${text}
"""`
  const result = await chatWithOllama([
    { role: 'system', content: ITEC_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ], 0.8)
  return result
}

export async function generateExecutiveSummary(notes: string): Promise<string> {
  const result = await processWithAI(notes, 'reunion')
  return result.summary
}

export async function generateActionItems(notes: string): Promise<string> {
  const result = await processWithAI(notes, 'reunion')
  return result.action_items.map((item, i) => `${i + 1}. ${item}`).join('\n')
}

export async function generatePublicArticle(rawFacts: string): Promise<{ title: string; content: string }> {
  const systemPrompt = `${ITEC_SYSTEM_PROMPT}
      
      Sos un redactor periodístico experto para ITEC. Tu misión es transformar "hechos crudos" en un artículo inspirador.
      
      ROL: Periodista social.
      OBJETIVO: Generar orgullo y pertenencia en Saladillo.
      TONO: Aspiracional, accesible y humano.
      ENFOQUE: Traducir la técnica a beneficios comunitarios. Estructura de pirámide invertida. Evitá tecnicismos.
      CIERRE: Frase que invite a sumarse al ecosistema ITEC.
      
      RESTRICCIONES CRÍTICAS:
      - No inventes datos; si falta información, redacta en torno a los hechos disponibles.
      - No menciones constantemente a Augusto Cicaré; solo si es indispensable para el contexto histórico.
      - Evitá las palabras prohibidas ("hoy", "ayer", "mañana", "che", "viste").
      - Respondé en formato JSON puro: { "title": "...", "content": "..." }`

  const userPrompt = `HECHOS PARA TRANSFORMAR:\n"""\n${rawFacts}\n"""`
  
  const raw = await chatWithOllama([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], 0.8)
  
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    return { 
      title: 'Innovación en Marcha', 
      content: raw 
    }
  }
}

export async function generateActionSuccessStory(
  actionTitle: string, 
  actionType: string,
  attendeesCount: number,
  keyTopics: string
): Promise<{ title: string; content: string }> {
  const systemPrompt = `${ITEC_SYSTEM_PROMPT}
      
      Sos el Director de Comunicación de ITEC. Tu tarea es redactar una "historia de éxito" tras finalizar una actividad externa.
      
      ROL: Jefe de Prensa.
      TONO: Institucional, seco y fáctico.
      ESTRUCTURA: Título + Bajada (Qué, Quién, Cuándo, Dónde) + Cuerpo breve + Cita simulada de autoridad de ITEC resaltando el hito.
      
      DATOS CLAVE:
      - Título: ${actionTitle}
      - Tipo: ${actionType}
      - Asistentes: ${attendeesCount} ciudadanos de Saladillo.
      - Temas tratados: ${keyTopics}
      
      RESTRICCIONES CRÍTICAS:
      - No inventes datos; si falta información, redacta en torno a los hechos disponibles.
      - No menciones constantemente a Augusto Cicaré; solo si es indispensable para el contexto histórico.
      - Evitá las palabras prohibidas ("hoy", "ayer", "mañana", "che", "viste").
      - Respondé en JSON: { "title": "...", "content": "..." }`

  const userPrompt = `Generar historia de éxito para la acción "${actionTitle}".`
  const raw = await chatWithOllama([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], 0.8)
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    return { title: `Éxito total en ${actionTitle}`, content: raw }
  }
}

export async function generateMulticanalNews(rawFacts: string): Promise<{
  titulo: string
  texto_publico: string
  texto_miembros: string
  texto_sponsors: string
  texto_medios: string
}> {
  const prompt = `Estilo ITEC: técnico, humano, vanguardista. Español formal con "vos". Prohibido: "hoy","ayer","mañana","che","viste","pibe","el ITEC","la ITEC". No menciones a Augusto Cicaré salvo necesario.

Dados estos hechos crudos, generá 5 piezas en JSON. Máximo 2 oraciones cada texto. Sin markdown. Sin inventar datos.

JSON:
{
  "titulo": "titular impacto (max 8 palabras)",
  "texto_publico": "para público: aspiracional, traducí técnica a beneficio comunitario",
  "texto_miembros": "para miembros: cálido, 'nosotros', celebrando esfuerzo colectivo",
  "texto_sponsors": "para sponsors: profesional, destacando impacto y métricas",
  "texto_medios": "para medios: institucional, gacetilla con cita de autoridad ITEC"
}

HECHOS: """${rawFacts}"""`

  const raw = await chatWithOllama([
    { role: 'user', content: prompt }
  ], 0.8, { num_ctx: 2048, timeout: 98000 })

  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    return {
      titulo: 'Novedad ITEC',
      texto_publico: rawFacts + '\n\nEsta iniciativa fortalece el acceso a la tecnología para toda la comunidad saladense.',
      texto_miembros: '¡Equipo! ' + rawFacts + '\n\nGracias a quienes hicieron posible este logro. Nuestro trabajo voluntario transforma realidades.',
      texto_sponsors: 'Evento con impacto en el ecosistema local. Destacan los contributos recibidos.',
      texto_medios: 'ITEC Saladillo informa actividad comunitaria. ' + rawFacts + '. "Un paso más hacia la innovación", comentó la institución.'
    }
  }
}

export async function generateVideoSummary(title: string, description: string): Promise<string> {
  const userPrompt = `Generá un resumen profesional y atractivo para un video de ITEC Saladillo.
  
  ROL: Periodista social.
  OBJETIVO: Generar orgullo y pertenencia en Saladillo.
  TONO: Aspiracional, accesible y humano.
  ENFOQUE: Traducir la técnica a beneficios comunitarios. Evitá tecnicismos innecesarios.
  CERRAR: Frase que invite a sumarse al ecosistema ITEC.
  
  TÍTULO DEL VIDEO: ${title}
  DESCRIPCIÓN ORIGINAL: ${description}
  
  REQUISITOS CRÍTICOS:
  - PRECISIÓN Y CONTENIDO REAL: Basarte en lo disponible sin inventar datos.
  - IDENTIFICACIÓN DE PROTAGONISTAS: Mencionar quién es el entrevistado/orador.
  - LONGITUD: Máximo 200 palabras.
  - ESTILO ITEC: Técnico, Humano y Vanguardista.
  - IDIOMA: Español rioplatense formal (usando "vos").
  
  Respondé únicamente con el texto del resumen, sin títulos adicionales ni comillas.`

  const result = await chatWithOllama([
    { role: 'system', content: ITEC_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ], 0.8)
  return result
}

export async function generarEmbedding(texto: string): Promise<number[]> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY_4 || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: { parts: [{ text: texto }] } })
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.embedding?.values && data.embedding.values.length > 0) {
          return data.embedding.values as number[]
        }
      }
      console.error('[AI Service] Gemini embedding failed:', response.status)
    } catch (error) {
      console.error('[AI Service] Gemini embedding error:', error)
    }
  }

  try {
    const hfKey = process.env.HF_API_KEY
    if (!hfKey) throw new Error('No HF_API_KEY configured')
    
    const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: texto })
    })

    if (!response.ok) throw new Error(`HF embedding error: ${response.status}`)
    
    const data = await response.json()
    return data[0]?.embedding || []
  } catch (error) {
    console.error('[AI Service] All embedding providers failed:', error)
    return []
  }
}

export interface FeedbackSimilar {
  id: string
  created_at: string
  historial: any
  calificacion: string
  comentario: string | null
  tema_principal: string
  lo_mas_util: string
  similarity: number
}

export async function buscarFeedbacksSimilares(
  mensaje: string,
  limit = 5,
  threshold = 0.3
): Promise<FeedbackSimilar[]> {
  try {
    const embedding = await generarEmbedding(mensaje)
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('buscar_feedbacks_similares', {
      query_embedding: embedding,
      similarity_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      console.error('[AI Service] Error al invocar la RPC buscar_feedbacks_similares:', error)
      return []
    }

    return (data as FeedbackSimilar[]) || []
  } catch (error) {
    console.error('[AI Service] Error en buscarFeedbacksSimilares:', error)
    return []
  }
}

export interface ResultadoAuditoria {
  tieneViolacion: boolean
  respuestaFinal: string
}

export async function auditarRespuestaIA(
  mensajeUsuario: string,
  respuestaIA: string,
  sessionId?: string
): Promise<ResultadoAuditoria> {
  try {
    let tieneViolacion = false
    let respuestaFinal = respuestaIA
    let reglaViolada: string | null = null
    let nivelGravedad: 'bajo' | 'medio' | 'alto' = 'bajo'

    const reglas = [
      {
        nombre: 'Mención prohibida a Peques ITEC',
        regex: /peques\s+itec/i,
        gravedad: 'alto' as const,
        fallback: 'Disculpame, pero no cuento con información sobre ese tema en particular en este momento. ¿Hay algún otro proyecto o actividad de ITEC sobre el que te gustaría conversar?'
      },
      {
        nombre: 'Exposición de rutas internas del código',
        regex: /\B\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*/,
        gravedad: 'alto' as const,
        fallback: 'Disculpame, pero no puedo revelar enlaces o rutas técnicas de la plataforma. Podés recorrer las secciones principales del sitio desde el menú de navegación.'
      },
      {
        nombre: 'Uso de regionalismos informales',
        regex: /\b(viste|che|pibe)\b/i,
        gravedad: 'bajo' as const,
        fallback: null
      },
      {
        nombre: 'Uso de palabras temporales genéricas',
        regex: /\b(hoy|ayer|mañana)\b/i,
        gravedad: 'bajo' as const,
        fallback: null
      }
    ]

    for (const regla of reglas) {
      if (regla.regex.test(respuestaIA)) {
        tieneViolacion = true
        reglaViolada = regla.nombre
        nivelGravedad = regla.gravedad

        if (regla.gravedad === 'alto' && regla.fallback) {
          respuestaFinal = regla.fallback
          break
        }
      }
    }

    if (tieneViolacion && reglaViolada) {
      const registroViolacion = {
        session_id: sessionId || null,
        mensaje_usuario: mensajeUsuario,
        respuesta_ia: respuestaIA,
        regla_violada: reglaViolada,
        nivel_gravedad: nivelGravedad
      }

      createClient().then(async (supabase) => {
        const { error } = await supabase
          .from('ai_auditoria_violaciones')
          .insert(registroViolacion)
        
        if (error) {
          console.error('[AI Audit] Error al persistir la violación de seguridad:', error.message)
        }
      }).catch(err => {
        console.error('[AI Audit] Error al crear el cliente de Supabase para auditoría:', err)
      })
    }

    return { tieneViolacion, respuestaFinal }
  } catch (error) {
    console.error('[AI Audit] Error inesperado en auditarRespuestaIA:', error)
    return { tieneViolacion: false, respuestaFinal: respuestaIA }
  }
}