import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY!)

const googleAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY_4 || process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY || ''
})

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

/**
 * Procesa un texto (transcripción de reunión o descripción de capacitación)
 * y genera resumen ejecutivo, tareas pendientes y flash informativo.
 */
export async function processWithAI(
  text: string,
  sourceType: 'meet' | 'capacitacion' | 'reunion' | 'manual',
  commissionName?: string
): Promise<AIProcessResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: ITEC_SYSTEM_PROMPT,
  })

  const contextLabel = {
    meet: 'transcripción de una reunión virtual de Google Meet',
    capacitacion: 'descripción de una capacitación',
    reunion: 'acta de reunión presencial',
    manual: 'texto de comunicación interna',
  }[sourceType]

  const commissionContext = commissionName
    ? `La información pertenece a la Comisión de ${commissionName}.`
    : ''

  const prompt = `
Se te entrega la ${contextLabel} de ITEC Saladillo.
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

Respondés ÚNICAMENTE con el JSON, sin ningún texto adicional antes o después.
`

  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()

  // Limpiar posibles bloques de código que el modelo incluya igual
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned) as AIProcessResult
  return parsed
}

/**
 * Genera únicamente un Flash Informativo corto a partir de un texto dado.
 */
export async function generateFlash(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: ITEC_SYSTEM_PROMPT,
  })

  const prompt = `
Con base en el siguiente texto, redactá un Flash Informativo de máximo 2 oraciones 
para el muro interno de ITEC. Dinámico, motivador, en Estilo ITEC.
Respondé únicamente con el texto del flash, sin comillas ni etiquetas.

TEXTO:
"""
${text}
"""
`
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

/**
 * Genera un Resumen Ejecutivo a partir de las notas de reunión.
 * Wrapper conveniente sobre processWithAI.
 */
export async function generateExecutiveSummary(notes: string): Promise<string> {
  const result = await processWithAI(notes, 'reunion')
  return result.summary
}

/**
 * Genera los Action Items formateados como lista de texto.
 * Wrapper conveniente sobre processWithAI.
 */
export async function generateActionItems(notes: string): Promise<string> {
  const result = await processWithAI(notes, 'reunion')
  return result.action_items.map((item, i) => `${i + 1}. ${item}`).join('\n')
}

/**
 * Genera un artículo periodístico optimista y contagioso a partir de hechos crudos.
 * Estilo ITEC: Elegante, Técnico y Humano.
 */
export async function generatePublicArticle(rawFacts: string): Promise<{ title: string; content: string }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: `
      ${ITEC_SYSTEM_PROMPT}
      
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
      - Respondé en formato JSON puro: { "title": "...", "content": "..." }
    `,
  })

  const prompt = `HECHOS PARA TRANSFORMAR:\n"""\n${rawFacts}\n"""`
  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    // Fallback si falla el parseo
    return { 
      title: 'Innovación en Marcha', 
      content: raw 
    }
  }
}

/**
 * Genera una nota de prensa optimista tras la finalización de una acción de impacto.
 * Analiza asistencia y temática para resaltar el éxito institucional.
 */
export async function generateActionSuccessStory(
  actionTitle: string, 
  actionType: string,
  attendeesCount: number,
  keyTopics: string
): Promise<{ title: string; content: string }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: `
      ${ITEC_SYSTEM_PROMPT}
      
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
      - Respondé en JSON: { "title": "...", "content": "..." }
    `,
  })

  const prompt = `Generar historia de éxito para la acción "${actionTitle}".`
  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    return { title: `Éxito total en ${actionTitle}`, content: raw }
  }
}

/**
 * Genera noticias multicanal a partir de hechos crudos.
 * Usa fallback automático entre múltiples API keys.
 */
export async function generateMulticanalNews(rawFacts: string): Promise<{
  titulo: string
  texto_publico: string
  texto_miembros: string
  texto_sponsors: string
  texto_medios: string
}> {
  const systemPrompt = `
${ITEC_SYSTEM_PROMPT}

Actuá como un Director de Comunicaciones Estratégicas experto. Tu misión es transformar "hechos crudos" en 5 piezas de comunicación con identidades TOTALMENTE divergentes.

RESTRICCIONES CRÍTICAS:
1. Responde ÚNICAMENTE con un JSON válido.
2. NO incluyas introducciones, comentarios ni etiquetas markdown.
3. NO menciones constantemente a Augusto Cicaré; solo si es indispensable para el contexto histórico.
4. NUNCA inventes datos; si falta información, redacta en torno a los hechos disponibles.

ESTRUCTURA DE RESPUESTA (JSON):
{
  "titulo": "Titular periodístico de alto impacto (máx. 10 palabras).",
  "texto_publico": "ROL: Periodista social. OBJETIVO: Generar orgullo y pertenencia en Saladillo. TONO: Aspiracional, accesible y humano. ENFOQUE: Traducir la técnica a beneficios comunitarios. Estructura de pirámide invertida. Evitá tecnicismos. Cerrá con una frase que invite a sumarse al ecosistema ITEC.",
  "texto_miembros": "ROL: Líder de equipo / Gestor interno. OBJETIVO: Reconocimiento y motivación. TONO: Cálido, entusiasta y muy cercano. ENFOQUE: Resaltá el 'quiénes' y el esfuerzo voluntario. Usá 'nosotros' y 'nuestro'. Celebrá los desafíos técnicos superados como una victoria colectiva.",
  "texto_sponsors": "ROL: Analista de Proyectos / Ejecutivo. OBJETIVO: Reportar ROI social y eficiencia. TONO: Pragmático, profesional y de rendición de cuentas. ENFOQUE: Impacto en el mapa productivo local, métricas de asistencia y eficiencia en el uso de los fondos (gastos vs. resultados). Destacá la alianza estratégica.",
  "texto_medios": "ROL: Jefe de Prensa. OBJETIVO: Publicación inmediata. TONO: Institucional, seco y fáctico. ESTRUCTURA: Título + Bajada (Qué, Quién, Cuándo, Dónde) + Cuerpo breve + Cita simulada de autoridad de ITEC resaltando el hito."
}`

const prompt = `HECHOS CRUDOS PARA TRANSFORMAR:\n"""\n${rawFacts}\n"""`

const raw = await generateTextWithFallback(prompt, systemPrompt)
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    // Fallback si falla el parseo
    return {
      titulo: 'Novedad ITEC',
      texto_publico: rawFacts + '\n\nEsta iniciativa fortalece el acceso a la tecnología para toda la comunidad saladense.',
      texto_miembros: '¡Equipo! ' + rawFacts + '\n\nGracias a quienes hicieron posible este logro. Nuestro trabajo voluntario transforma realidades.',
      texto_sponsors: 'Evento con impacto en el ecosistema local. Destacan los contributos recibidos.',
      texto_medios: 'ITEC Saladillo informa actividad comunitaria. ' + rawFacts + '. "Un paso más hacia la innovación", comentó la institución.'
    }
  }
}

/**
 * Genera un resumen profesional de hasta 200 palabras para un video.
 */
export async function generateVideoSummary(title: string, description: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: ITEC_SYSTEM_PROMPT,
  })

  const prompt = `
    Generá un resumen profesional y atractivo para un video de ITEC Saladillo.
    
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
    
    Respondé únicamente con el texto del resumen, sin títulos adicionales ni comillas.
  `

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

/**
 * Genera el embedding de un texto usando el modelo text-embedding-004 de Google.
 */
export async function generarEmbedding(texto: string): Promise<number[]> {
  try {
    const response = await googleAI.models.embedContent({
      model: 'text-embedding-004',
      contents: texto,
    });

    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
      throw new Error('No se devolvieron valores de embedding en la respuesta.');
    }

    return response.embeddings[0].values;
  } catch (error) {
    console.error('[AI Service] Error al generar embedding con text-embedding-004:', error);
    throw error;
  }
}

/**
 * Genera texto con IA usando fallback automático entre múltiples API keys.
 */
async function generateTextWithFallback(prompt: string, systemPrompt: string): Promise<string> {
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
  ].filter(Boolean) as string[]

  let lastError: Error | null = null

  for (const apiKey of apiKeys) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: systemPrompt,
      })

      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      
      if (text) return text
      lastError = new Error('Empty response')
    } catch (err: any) {
      lastError = err
      console.warn(`[AI Fallback] Key failed, trying next...`, err.message?.substring(0, 50))
      continue
    }
  }

  throw lastError || new Error('All API keys exhausted')
}

export interface FeedbackSimilar {
  id: string;
  created_at: string;
  historial: any;
  calificacion: string;
  comentario: string | null;
  tema_principal: string;
  lo_mas_util: string;
  similarity: number;
}

/**
 * Busca feedbacks similares utilizando embeddings y la función RPC buscar_feedbacks_similares.
 */
export async function buscarFeedbacksSimilares(
  mensaje: string,
  limit = 5,
  threshold = 0.3
): Promise<FeedbackSimilar[]> {
  try {
    // 1. Generar el embedding de la pregunta del usuario
    const embedding = await generarEmbedding(mensaje);

    // 2. Obtener el cliente de Supabase
    const supabase = await createClient();

    // 3. Ejecutar la RPC para obtener registros similares
    const { data, error } = await supabase.rpc('buscar_feedbacks_similares', {
      query_embedding: embedding,
      similarity_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('[AI Service] Error al invocar la RPC buscar_feedbacks_similares:', error);
      return [];
    }

    return (data as FeedbackSimilar[]) || [];
  } catch (error) {
    console.error('[AI Service] Error en buscarFeedbacksSimilares:', error);
    return [];
  }
}

export interface ResultadoAuditoria {
  tieneViolacion: boolean
  respuestaFinal: string
}

/**
 * Analiza en tiempo real la respuesta de la IA para prevenir violaciones a las reglas críticas.
 * Registra de forma asíncrona las violaciones en Supabase para no penalizar el tiempo de respuesta.
 * Si la gravedad es alta, sustituye el contenido en caliente con un fallback seguro.
 */
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

    // Definición de las reglas críticas y sus regex
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

    // Evaluar cada una de las reglas de forma secuencial
    for (const regla of reglas) {
      if (regla.regex.test(respuestaIA)) {
        tieneViolacion = true
        reglaViolada = regla.nombre
        nivelGravedad = regla.gravedad

        // Si la regla tiene un nivel de gravedad alto, reescribimos la respuesta en caliente
        if (regla.gravedad === 'alto' && regla.fallback) {
          respuestaFinal = regla.fallback
          break // Priorizamos detenernos en la primera violación grave
        }
      }
    }

    // Registrar en Supabase de forma totalmente asíncrona si hay violación
    if (tieneViolacion && reglaViolada) {
      const registroViolacion = {
        session_id: sessionId || null,
        mensaje_usuario: mensajeUsuario,
        respuesta_ia: respuestaIA,
        regla_violada: reglaViolada,
        nivel_gravedad: nivelGravedad
      }

      // Iniciamos la promesa pero NO usamos await, permitiendo que se ejecute en segundo plano
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



