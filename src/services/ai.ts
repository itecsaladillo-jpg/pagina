import { createClient } from '@/lib/supabase/server'
import { getSettingValue } from '@/lib/settings'

type ProviderError = Error & { status?: number }

function providerError(msg: string, status?: number): ProviderError {
  const e = new Error(msg) as ProviderError
  e.status = status
  return e
}

const GROQ_MODEL = 'openai/gpt-oss-20b'
const OPENROUTER_MODEL = 'nvidia/nemotron-3.5-lightning:free'
const GEMINI_MODEL = 'gemini-flash-latest'

async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
  const dbKeys = await Promise.all([
    getSettingValue('groq_api_key'),
    getSettingValue('groq_api_key_2'),
  ])
  const envKeys = [process.env.GROQ_API_KEY || '', process.env.GROQ_API_KEY_2 || '']
  const seen = new Set<string>()
  const allKeys: string[] = []
  for (const k of [...envKeys, ...dbKeys]) {
    if (k && k.trim() !== '' && !seen.has(k)) { seen.add(k); allKeys.push(k) }
  }
  if (allKeys.length === 0) throw providerError('GROQ_API_KEY not set')

  console.log(`[Groq] ${allKeys.length} keys: ${allKeys.map(k => `...${k.slice(-6)}`).join(', ')}`)

  const keyErrors: string[] = []
  const attempts = allKeys.map(async (apiKey) => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        max_tokens: 8192,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`key ...${apiKey.slice(-6)} ${res.status}: ${errBody.slice(0, 100)}`)
    }

    const data = await res.json()
    const texto = data.choices?.[0]?.message?.content || ''
    if (!texto.trim()) throw new Error(`key ...${apiKey.slice(-6)} respuesta vacía`)
    return texto
  })

  const results = await Promise.allSettled(attempts)
  for (const r of results) {
    if (r.status === 'fulfilled') return r.value
    keyErrors.push(r.reason?.message || 'error')
  }
  throw providerError(`[Groq] ${keyErrors.join(' | ')}`)
}

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  const dbKeys = await Promise.all([
    getSettingValue('openrouter_api_key'),
    getSettingValue('openrouter_api_key_2'),
  ])
  const envKeys = [process.env.OPENROUTER_API_KEY || '', process.env.OPENROUTER_API_KEY_2 || '']
  const seen = new Set<string>()
  const allKeys: string[] = []
  for (const k of [...envKeys, ...dbKeys]) {
    if (k && k.trim() !== '' && !seen.has(k)) { seen.add(k); allKeys.push(k) }
  }
  if (allKeys.length === 0) throw providerError('OPENROUTER_API_KEY not set')

  console.log(`[OpenRouter] ${allKeys.length} keys: ${allKeys.map(k => `...${k.slice(-6)}`).join(', ')}`)

  const models = ['nvidia/nemotron-3.5-lightning:free', 'minimax/minimax-m3:free']

  // Combinar keys x modelos, lanzar todo en paralelo
  const attempts: Promise<string>[] = []
  for (const apiKey of allKeys) {
    for (const model of models) {
      attempts.push(
        fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://itecsaladillo.org.ar',
            'X-Title': 'ITEC Comunicacion',
          },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            temperature: 0.7,
            max_tokens: 8192,
          }),
          signal: AbortSignal.timeout(10000),
        })
        .then(async (res) => {
          if (!res.ok) {
            const errBody = await res.text().catch(() => '')
            throw new Error(`${model} key...${apiKey.slice(-6)} ${res.status}: ${errBody.slice(0, 80)}`)
          }
          const data = await res.json()
          const texto = data.choices?.[0]?.message?.content || ''
          if (!texto.trim()) throw new Error(`${model} key...${apiKey.slice(-6)} vacía`)
          return texto
        })
      )
    }
  }

  const results = await Promise.allSettled(attempts)
  const errors: string[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') return r.value
    errors.push(r.reason?.message || 'error')
  }
  throw providerError(`[OpenRouter] ${errors.join(' | ')}`)
}

async function callGemini(
  messages: { role: string; content: string }[],
  temperature: number
): Promise<string> {
  // Recopilar keys de DB Y de env vars, deduplicando.
  // Priorizar env vars (las que el usuario acaba de agregar).
  const dbKeys = await Promise.all([
    getSettingValue('gemini_api_key'),
    getSettingValue('gemini_api_key_2'),
    getSettingValue('gemini_api_key_3'),
    getSettingValue('gemini_api_key_4'),
  ])
  const envKeys = [
    process.env.GEMINI_API_KEY || '',
    process.env.GEMINI_API_KEY_2 || '',
    process.env.GEMINI_API_KEY_3 || '',
    process.env.GEMINI_API_KEY_4 || '',
  ]
  // Unir: env first (más recientes), luego DB, sin duplicados
  const seen = new Set<string>()
  const allKeys: string[] = []
  for (const k of [...envKeys, ...dbKeys]) {
    if (k && k.trim() !== '' && !seen.has(k)) {
      seen.add(k)
      allKeys.push(k)
    }
  }
  if (allKeys.length === 0) throw providerError('[Gemini] no API key configurada')

  console.log(`[Gemini] ${allKeys.length} keys disponibles: ${allKeys.map(k => `...${k.slice(-6)}`).join(', ')}`)

  const systemMsg = messages.find(m => m.role === 'system')?.content || ''
  const userMsg = messages.filter(m => m.role === 'user').map(m => m.content).join('\n')

  // Lanzar TODAS las keys EN PARALELO, la primera que responda gana
  const keyErrors: string[] = []
  const attempts = allKeys.map(async (key) => {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
            contents: [{ parts: [{ text: userMsg }] }],
            generationConfig: { temperature, maxOutputTokens: 8192 },
          }),
          signal: AbortSignal.timeout(10000),
        },
      )

      if (!res.ok) {
        const err = await res.text().catch(() => '')
        throw new Error(`key ...${key.slice(-6)} ${res.status}: ${err.slice(0, 100)}`)
      }

      const data = await res.json()
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (!texto.trim()) throw new Error(`key ...${key.slice(-6)} respuesta vacía`)
      return texto
    } catch (err: any) {
      keyErrors.push(err?.message || 'error')
      throw err
    }
  })

  const results = await Promise.allSettled(attempts)
  for (const r of results) {
    if (r.status === 'fulfilled') return r.value
  }
  throw providerError(`[Gemini] ${keyErrors.join(' | ')}`)
}

async function callAI(messages: { role: string; content: string }[], temperature = 0.7): Promise<string> {
  // Estimar tokens: Groq free tier limita a 8000 TPM por cuenta.
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
  const estimTokens = Math.ceil(totalChars / 3.5)
  const skipGroq = estimTokens > 5000

  if (skipGroq) {
    console.warn(`[AI Service] Prompt grande (~${estimTokens} tokens) — Groq deshabilitado`)
  }

  // Lanzar todos los providers EN PARALELO. El primero que responda gana.
  // Esto es crítico para Vercel Hobby (maxDuration ~10s).
  const candidates: { nombre: string; promise: Promise<string> }[] = []

  if (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY_2) {
    candidates.push({ nombre: 'openrouter', promise: callOpenRouter(messages) })
  }

  // Gemini: necesitamos la key, launch la promise de resolución de key en paralelo
  const geminiKey = await (async () => {
    const keys = await Promise.all([
      getSettingValue('gemini_api_key', 'GEMINI_APY_KEY'),
      getSettingValue('gemini_api_key_2', 'GEMINI_API_KEY_2'),
      getSettingValue('gemini_api_key_3', 'GEMINI_API_KEY_3'),
      getSettingValue('gemini_api_key_4', 'GEMINI_API_KEY_4'),
    ])
    return keys.find(k => k) || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  })()

  if (geminiKey) {
    candidates.push({ nombre: 'gemini', promise: callGemini(messages, temperature) })
  }

  if ((process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2) && !skipGroq) {
    candidates.push({ nombre: 'groq', promise: callGroq(messages) })
  }

  if (candidates.length === 0) {
    throw new Error('[AI Service] Ningún provider disponible (sin API keys)')
  }

  console.log(`[AI Service] Lanzando ${candidates.length} providers en paralelo: ${candidates.map(c => c.nombre).join(', ')}`)

  // Usar Promise.any: resuelve con el primer成功, rechaza si TODOS fallan
  const errores: string[] = []
  const results = await Promise.allSettled(candidates.map(c =>
    c.promise.then(ok => ({ ok: true, nombre: c.nombre, texto: ok } as const))
      .catch(err => { throw { nombre: c.nombre, error: err } })
  ))

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.ok) {
      console.log(`[AI Service] OK con ${r.value.nombre}`)
      return r.value.texto
    }
    if (r.status === 'rejected') {
      const e = r.reason
      const msg = e?.error?.message || e?.message || 'error desconocido'
      errores.push(`${e?.nombre || 'unknown'}: ${msg}`)
      console.error(`[AI Service] ${e?.nombre} falló:`, msg)
    }
  }

  throw new Error(`[AI Service] Todos los providers fallaron:\n${errores.join('\n')}`)
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

  const raw = await callAI([
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
  const result = await callAI([
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

export async function generateMulticanalNews(rawFacts: string): Promise<{
  titulo: string
  texto_publico: string
  texto_miembros: string
  texto_sponsors: string
  texto_medios: string
}> {
  const systemPrompt = `${ITEC_SYSTEM_PROMPT}
  
  Generás textos profesionales para diferentes audiencias de ITEC.`

  const userPrompt = `Actuá como Jefe de Prensa y redactor profesional de ITEC Saladillo. Generá un titular y 4 textos para diferentes audiencias basándote en las notas crudas que están al final.

INSTRUCCIONES POR CANAL (seguilas estrictamente para que cada texto tenga su identidad propia):

=== CANAL PÚBLICO ===
Propósito: Noticia para la página web oficial.
Tono: Tercera persona, institucional pero accesible. Sin "nosotros".
Estructura: TITULAR atractivo con verbo de acción → COPETE/LEAD (5W: qué, quiénes, dónde, cuándo, cómo, por qué) → DESARROLLO (2-3 párrafos, impacto en comunidad, identificar expositores) → CITA TEXTUAL entre comillas → CIERRE positivo → CTA final.
Prohibido: balance económico, enumerar aciertos/errores.
Separar secciones con \\n\\n.

=== CANAL MIEMBROS ===
Propósito: Comunicación interna para el equipo ITEC.
Tono: PRIMERA PERSONA DEL PLURAL ("nosotros", "nuestro"), cercano, entusiasta, con emojis moderados (🎉💪✨🚀).
Estructura: ASUNTO motivador → SALUDO cordial → AGRADECIMIENTO explícito (nominar personas destacadas) → LO QUE FUNCIONÓ (lista 2-4 items) → LO QUE MEJORAR (lista 2-4 items constructivos) → CONEXIÓN CON COMETIDO GENERAL de ITEC → CITA DE LIDERAZGO → INVITACIÓN a fotos/video → CIERRE con firma "Equipo ITEC".
Prohibido: balance económico.
Separar secciones con \\n\\n.

=== CANAL SPONSORS ===
Propósito: Reporte de valor para sponsors (socios estratégicos, NO donantes).
Tono: Profesional, formal B2B, orientado a resultados. SIN emojis.
Estructura: ASUNTO con "Resultados" o "Impacto" → SALUDO formal → AGRADECIMIENTO por la confianza → IMPORTANCIA DE LA ALIANZA → IMPACTO EN LA COMUNIDAD → BALANCE ECONÓMICO (usar placeholders [Monto] si no hay dato exacto) → HIGHLIGHTS cuantitativos → VISIBILIDAD DE MARCA → EVIDENCIA ADJUNTA (PDF + fotos) → INVITACIÓN A FUTURO → Cierre formal.
Prohibido: tratar al sponsor como donante, emojis.
Separar secciones con \\n\\n.

=== CANAL MEDIOS ===
Propósito: Gacetilla de prensa para medios periodísticos.
Tono: Periodístico objetivo, tercera persona estricta, SIN emojis, SIN adjetivos subjetivos.
Estructura: ENCABEZADO "GACETILLA DE PRENSA – PARA PUBLICACIÓN INMEDIATA" → LUGAR Y FECHA → TITULAR INFORMATIVO → LEAD (5W) → CUERPO con contexto y actividades → PRÓXIMOS EVENTOS Y PROYECTOS → CITA TEXTUAL ATRIBUIBLE → CIERRE con mención de fotos disponibles → ACERCA DE ITEC (2-3 líneas) → CONTACTO DE PRENSA con placeholders.
Prohibido: información interna, emojis, balance económico.
Separar secciones con \\n\\n.

Respondé ÚNICAMENTE con este JSON, sin texto adicional, sin markdown, sin bloques de código:

{
  "titulo": "titular periodístico con verbo de acción (máx 8 palabras)",
  "texto_publico": "texto completo para canal público siguiendo las instrucciones de PUBLICO",
  "texto_miembros": "texto completo para canal miembros siguiendo las instrucciones de MIEMBROS",
  "texto_sponsors": "texto completo para canal sponsors siguiendo las instrucciones de SPONSORS",
  "texto_medios": "texto completo para canal medios siguiendo las instrucciones de MEDIOS"
}

NOTAS CRUDAS:
"""${rawFacts}"""`

  const raw = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], 0.8)

  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

  // Estrategia de parseo robusta: si la respuesta vino con markdown o etiquetas
  // (ej: "**Titular:** ..."), extraemos el primer bloque { ... } balanceado.
  const tryParse = (text: string): any | null => {
    try { return JSON.parse(text) } catch { return null }
  }

  let parsed = tryParse(cleaned)
  if (!parsed) {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      parsed = tryParse(cleaned.slice(start, end + 1))
    }
  }

  if (parsed) {
    return {
      titulo: parsed.titulo || '',
      texto_publico: parsed.texto_publico || '',
      texto_miembros: parsed.texto_miembros || '',
      texto_sponsors: parsed.texto_sponsors || '',
      texto_medios: parsed.texto_medios || ''
    }
  }

  // Fallback si el modelo no devolvió JSON válido
  console.error('[generateMulticanalNews] Respuesta no parseable como JSON:\n', raw)
  return {
    titulo: 'Novedad ITEC',
    texto_publico: rawFacts + '\n\nEsta iniciativa fortalece el acceso a la tecnología para toda la comunidad saladense.',
    texto_miembros: '¡Equipo! ' + rawFacts + '\n\nGracias a quienes hicieron posible este logro. Nuestro trabajo voluntario transforma realidades.',
    texto_sponsors: 'Evento con impacto en el ecosistema local. Destacan los contributos recibidos.',
    texto_medios: 'ITEC Saladillo informa actividad comunitaria. ' + rawFacts + '. "Un paso más hacia la innovación", comentó la institución.'
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

  const result = await callAI([
    { role: 'system', content: ITEC_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ], 0.8)
  return result
}

export async function generarEmbedding(texto: string): Promise<number[]> {
  const [geminiKey1, geminiKey2, geminiKey3, geminiKey4, hfKey] = await Promise.all([
    getSettingValue('gemini_api_key', 'GEMINI_APY_KEY'),
    getSettingValue('gemini_api_key_2', 'GEMINI_API_KEY_2'),
    getSettingValue('gemini_api_key_3', 'GEMINI_API_KEY_3'),
    getSettingValue('gemini_api_key_4', 'GEMINI_API_KEY_4'),
    getSettingValue('hf_api_key', 'HF_API_KEY'),
  ])
  const geminiKey = geminiKey1 || geminiKey2 || geminiKey3 || geminiKey4 || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
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
    const hfEmbedding: number[] = data[0]?.embedding || []
    
    if (hfEmbedding.length === 0) return []
    
    // HuggingFace all-MiniLM-L6-v2 produces 384-dim vectors, but our DB expects 768.
    // Pad with zeros to maintain compatibility with pgvector vector(768).
    const TARGET_DIM = 768
    if (hfEmbedding.length < TARGET_DIM) {
      const padded = new Array(TARGET_DIM).fill(0)
      for (let i = 0; i < hfEmbedding.length; i++) {
        padded[i] = hfEmbedding[i]
      }
      return padded
    }
    
    return hfEmbedding
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

    interface ReglaAuditoria {
      nombre: string
      regex: RegExp
      gravedad: 'bajo' | 'alto'
      /** Texto de reemplazo total (solo si la respuesta debe anularse). */
      fallback?: string
      /** Si está definido: redacta las coincidencias con este texto en vez de anular la respuesta. */
      redactar?: string
    }

    const reglas: ReglaAuditoria[] = [
      {
        nombre: 'Mención de Peques ITEC (monitoreo)',
        // ago 2026: el prompt maestro (ai_prompt_settings.asistente_global) define
        // Peques ITEC como programa PÚBLICO difundible ("podés brindarle difusión e
        // información abierta a la comunidad"). Antes esta regla tenía gravedad
        // 'alto' y reemplazaba TODA la respuesta por una negativa genérica cada vez
        // que el modelo mencionaba legítimamente el programa — era la causa
        // principal de las negativas frecuentes del asistente. Ahora solo se
        // registra para monitoreo, sin alterar la respuesta.
        regex: /peques\s+itec/i,
        gravedad: 'bajo' as const
      },
      {
        nombre: 'Exposición de rutas internas del código',
        regex: /(?:src\/|components\/|app\/|lib\/|pages\/|api\/|services\/|contexts\/)[a-zA-Z0-9_/-]+\.(?:ts|tsx|js|jsx)/i,
        gravedad: 'alto' as const,
        // ago 2026: en vez de anular toda la respuesta (perdía información útil),
        // se redacta únicamente la ruta detectada.
        redactar: 'Sección interna del sitio ITEC'
      },
      {
        nombre: 'Uso de regionalismos informales',
        regex: /\b(viste|che|pibe)\b/i,
        gravedad: 'bajo' as const
      },
      {
        nombre: 'Uso de palabras temporales genéricas',
        regex: /\b(hoy|ayer|mañana)\b/i,
        gravedad: 'bajo' as const
      }
    ]

    for (const regla of reglas) {
      if (regla.regex.test(respuestaIA)) {
        tieneViolacion = true
        reglaViolada = regla.nombre
        nivelGravedad = regla.gravedad

        if (regla.redactar && regla.gravedad === 'alto') {
          const regexGlobal = new RegExp(regla.regex.source, 'gi')
          respuestaFinal = respuestaFinal.replace(regexGlobal, regla.redactar)
        } else if (regla.gravedad === 'alto' && regla.fallback) {
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