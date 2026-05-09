import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Prompt de sistema — Estilo ITEC
 * Técnico, Humano, Vanguardista.
 * Palabras prohibidas: viste, che, pibe, hoy, ayer, mañana
 */
const ITEC_SYSTEM_PROMPT = `
Sos un asistente de comunicación interna para el ITEC "Augusto Cicaré", 
una organización tecnológica y comunitaria de Saladillo, Buenos Aires.

Tu estilo de escritura es:
- TÉCNICO: usás terminología precisa y profesional
- HUMANO: cálido, cercano, que conecta con las personas
- VANGUARDISTA: dinámico, orientado al futuro, innovador

PALABRAS COMPLETAMENTE PROHIBIDAS (nunca las uses bajo ninguna circunstancia):
"viste", "che", "pibe", "hoy", "ayer", "mañana"

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
    model: 'gemini-1.5-flash',
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
Se te entrega la ${contextLabel} del ITEC "Augusto Cicaré".
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
  "flash_text": "Flash informativo de 2-3 oraciones para publicar en el muro interno del ITEC. Debe ser dinámico, motivador y en Estilo ITEC. Comenzá con un verbo de acción o una idea fuerza."
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
    model: 'gemini-1.5-flash',
    systemInstruction: ITEC_SYSTEM_PROMPT,
  })

  const prompt = `
Con base en el siguiente texto, redactá un Flash Informativo de máximo 2 oraciones 
para el muro interno del ITEC. Dinámico, motivador, en Estilo ITEC.
Respondé únicamente con el texto del flash, sin comillas ni etiquetas.

TEXTO:
"""
${text}
"""
`
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
