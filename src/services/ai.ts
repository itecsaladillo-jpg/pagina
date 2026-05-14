import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY!)

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
  flash_text: string
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

Generá exactamente tres elementos en formato JSON puro (sin markdown, sin bloques de código):

{
  "summary": "Resumen ejecutivo de 3-5 oraciones, capturando los puntos principales tratados.",
  "action_items": [
    "Tarea concreta 1 con responsable si se menciona",
    "Tarea concreta 2",
    "..."
  ],
  "flash_text": "Flash informativo de 2-3 oraciones para publicar en el muro interno de ITEC. Debe ser dinámico, motivador y en Estilo ITEC. Comenzá con un verbo de acción o una idea fuerza."
}

Respondé ÚNICAMENTE con el JSON, sin ningún texto adicional antes o después.
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
      
      TONO:
      - Profundamente POSITIVO y OPTIMISTA.
      - CONTAGIOSO: debe hacer que el lector sienta orgullo por Saladillo y ganas de participar.
      - RESALTA: el progreso, la curiosidad tecnológica y la transformación social.
      
      ESTRUCTURA:
      1. TÍTULO: Atrapante, corto y con fuerza. Sin comillas.
      2. PRIMER PÁRRAFO (EL GANCHO): Debe ser una "IDEA FUERZA" extremadamente contundente y positiva que resuma el impacto social/tecnológico. Su objetivo es tentar al lector a abrir el artículo completo. RESTRICCIÓN CRÍTICA: Este párrafo DEBE tener un máximo de 25 palabras.
      3. CUERPO: 2-3 párrafos adicionales que narren los hechos con fluidez.
      4. CIERRE (CTA): Una frase final que invite al lector a ser parte del cambio o a hacer algo más por su comunidad.
      
      RESTRICCIONES:
      - No uses palabras informales ni lunfardo.
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
      
      DATOS CLAVE:
      - Título: ${actionTitle}
      - Tipo: ${actionType}
      - Asistentes: ${attendeesCount} ciudadanos de Saladillo.
      - Temas tratados: ${keyTopics}
      
      TONO:
      - Triunfalista pero elegante.
      - Enfocado en el "Impacto Real": cómo esto cambia la vida de la gente.
      - Saladillo como polo tecnológico.
      
      ESTRUCTURA:
      1. TÍTULO: Un titular potente de éxito.
      2. PRIMER PÁRRAFO: El gancho que resalta la magnitud del encuentro y el impacto en Saladillo. Debe ser contundente y positivo para tentar al lector a leer más. RESTRICCIÓN CRÍTICA: Máximo 25 palabras.
      3. CUERPO: Narra la jornada, resalta la participación y el entusiasmo.
      4. CIERRE: Frase inspiradora sobre el futuro.
      
      Respondé en JSON: { "title": "...", "content": "..." }
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
 * Genera un resumen profesional de hasta 150 palabras para un video.
 */
export async function generateVideoSummary(title: string, description: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: ITEC_SYSTEM_PROMPT,
  })

  const prompt = `
    Generá un resumen profesional y atractivo para un video de ITEC Saladillo.
    
    TÍTULO DEL VIDEO: ${title}
    DESCRIPCIÓN ORIGINAL: ${description}
    
    REQUISITOS:
    - IDENTIFICACIÓN DE PROTAGONISTAS: Debés actuar como un detective. Identificá y mencioná explícitamente quién es el entrevistado, orador o responsable. Prestá especial atención a las menciones al comienzo del texto, presentaciones de "quién nos acompaña hoy" o nombres que aparezcan en lo que parece ser la gráfica o placa de presentación del video.

    - Longitud: Máximo 150 palabras.
    - Estilo: ITEC (Técnico, Humano, Vanguardista).
    - Objetivo: Captar el interés del público y resumir los puntos clave.
    - Idioma: Español rioplatense formal (usando "vos").
    
    Respondé únicamente con el texto del resumen, sin títulos adicionales ni comillas.

  `

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

