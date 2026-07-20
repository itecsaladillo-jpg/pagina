import { createClient } from '@/lib/supabase/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_API_BASE_URL || 'https://ai.itecsaladillo.org.ar'
const OLLAMA_MODEL = 'llama3.2:latest'

async function callOpenRouter(messages: { role: string; content: string }[], temperature = 0.7): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://itecsaladillo.org.ar',
      'X-Title': 'ITEC AI'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages,
      stream: false,
      temperature,
      max_tokens: 8192
    })
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`OpenRouter error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
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

  const raw = await callOpenRouter([
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
  const result = await callOpenRouter([
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
  
  const raw = await callOpenRouter([
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
  const raw = await callOpenRouter([
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
  const systemPrompt = `${ITEC_SYSTEM_PROMPT}
  
  Generás textos profesionales para diferentes audiencias de ITEC.`

  const userPrompt = `Actuá como Jefe de Prensa y redactor profesional de ITEC Saladillo. Generá 5 piezas siguiendo EXACTAMENTE este esquema JSON (no agregues texto fuera del JSON, no uses markdown, no uses etiquetas como **Titular:**):

  {
    "titulo": "Titular periodístico atractivo con verbo de acción (máx 8 palabras)",
    "texto_publico": "NOTICIA PARA LA PÁGINA OFICIAL. Estructura pirámide invertida en tercera persona, tono institucional pero accesible. IMPORTANTE: separá cada sección con DOS SALTOS DE LINEA (\\n\\n) para generar párrafos diferenciados; nunca entregues todo en un solo bloque. (1) TITULAR: atractivo y directo, verbo de acción, resume la esencia (ej: 'ITEC celebró con éxito [Evento] promoviendo [objetivo]'). (2) COPETE/LEAD: primer párrafo responde las 6 preguntas: QUÉ es el evento o noticia, QUIÉNES son los expositores, proveedores o generadores de la noticia, DÓNDE, CUÁNDO, CÓMO se desarrolla y POR QUÉ se realiza. (3) DESARROLLO: 2-3 párrafos contando de qué trata el evento o noticia, el impacto que tendrá o que tuvo en la comunidad, y detalles de las actividades. Identificá a los expositores, proveedores o generadores de la noticia mencionando sus nombres y roles. Priorizá lo más importante al principio. (4) CITA TEXTUAL de una autoridad o referente de ITEC que humanice la nota (entre comillas dobles \", formato: \"...\", señaló [Nombre, cargo]). (5) CIERRE positivo: impacto en la comunidad o próximos pasos. (6) CALL TO ACTION final invitando a ver fotos/videos/materiales. CRÍTICO: NO incluyas balance económico del evento. NO enumeres cosas que salieron bien o mal. Esta nota es informativa y aspiracional, no un balance interno. REGLAS: tercera persona (sin 'nosotros'), sin tecnicismos excesivos, siglas aclaradas en su primera mención. No inventes datos: si falta información, redacta en torno a los hechos disponibles.",
    "texto_miembros": "COMUNICACIÓN INTERNA PARA EL EQUIPO DE ITEC. Tono cercano, directo y entusiasta, escrito en PRIMERA PERSONA DEL PLURAL ('nosotros', 'nuestro'). Reconocimiento del esfuerzo compartido y sentido de pertenencia. IMPORTANTE: separá cada sección con DOS SALTOS DE LINEA (\\n\\n) para generar párrafos diferenciados. (1) ASUNTO motivador y conciso en mayúsculas o con signos de exclamación (ej: '¡Lo logramos! Balance de [Evento]' o 'Gracias por hacer posible [Evento]'). (2) SALUDO cordial al equipo ('Hola equipo', 'Querido equipo'). (3) AGRADECIMIENTO INICIAL explícito: usá la palabra 'gracias' o 'agradecer' para reconocer el compromiso y dedicación de quienes trabajaron o trabajan en el evento o proyecto (ej: 'Queremos agradecer profundamente...'). Felicitá por nombre o rol a quienes se destacaron. (4) LO QUE FUNCIONÓ (cosas buenas para repetir): lista de 2-4 puntos que salieron bien y que debemos replicar en futuros eventos. (5) LO QUE MEJORAR (cosas malas para mejorar): lista de 2-4 puntos que no salieron como esperábamos, presentados de forma constructiva como oportunidades de mejora. (6) CONEXIÓN CON EL COMETIDO GENERAL: explicá brevemente cómo este evento o noticia es un aporte más al cometido general de ITEC (su misión institucional). (7) CITA DE LIDERAZGO breve de la dirección que refuerce el valor del trabajo y el rumbo. (8) INVITACIÓN a revivir momentos (fotos/video en drive) y a compartir comentarios. (9) CIERRE motivador mirando al próximo desafío, con firma institucional ('Un saludo cordial, Equipo ITEC'). Usá emojis naturales (🎉💪✨🚀) sin exagerar. CRÍTICO: NO incluyas balance económico. Esta nota es de reconocimiento y retrospective interno, no un informe financiero. REGLAS: lenguaje inclusivo y cálido, celebrá el logro grupal (nunca concentres el mérito en una sola persona o área). No inventes datos: si falta información, redacta en torno a los hechos disponibles.",
    "texto_sponsors": "INFORME DE RESULTADOS PARA SPONSORS (Reporte de Valor). Tono profesional, orientado a resultados y centrado en el RETORNO DE VALOR (branding y visibilidad). Los sponsors son aliados estratégicos, NO donantes. IMPORTANTE: separá cada sección con DOS SALTOS DE LINEA (\\n\\n) para generar párrafos diferenciados. (1) ASUNTO profesional que incluya nombre del evento y la palabra 'Resultados' o 'Impacto' (ej: 'Informe de Resultados: [Evento] | Gracias por su compromiso con ITEC'). (2) SALUDO formal personalizado ('Estimados/as [Nombre del contacto en la empresa]:'). (3) AGRADECIMIENTO POR LA CONFIANZA en su apoyo, mencionando el evento y fecha. (4) LA IMPORTANCIA DE LO QUE HACEMOS JUNTOS: explicá por qué este evento/proyecto es relevante y cómo la alianza con el sponsor lo hace posible. (5) IMPACTO EN LA COMUNIDAD: describí el impacto concreto que queremos generar o que ya se generó (beneficios para la comunidad, reducción de brechas, acceso a tecnología, formación, etc.). (6) BALANCE ECONÓMICO: detallá cómo se utilizaron los fondos que el sponsor aportó (inversiones, compras de kits/materiales, servicios, logística). Si no hay datos exactos en las notas, usá placeholders como [Monto invertido en X] o [Cantidad] pero dejá la estructura del balance completa para que el usuario complete. (7) RESUMEN EJECUTIVO (Highlights): datos cuantitativos concretos en formato lista (alcance, asistentes, interacciones en redes, metas cumplidas). (8) VISIBILIDAD DE MARCA: evidencia de dónde y cómo apareció el logo/nombre del sponsor (banners, presentaciones, redes sociales, materiales gráficos, fotos). (9) EVIDENCIA ADJUNTA: mencioná explícitamente que se adjunta o comparte un PDF breve (1-2 páginas) con métricas y una carpeta de fotos donde se vea claramente el logo del sponsor. (10) INVITACIÓN A FUTURO: mantener la puerta abierta para próximas alianzas, ofrecer reunión para compartir visión a futuro. Cierre con firma institucional ('Atentamente, [Nombre y cargo]'). REGLAS: enfoque WIN-WIN, nunca los trates como fuente de dinero (usá 'gracias a nuestra alianza', no 'gracias por el dinero'); SIN emojis (es comunicación formal B2B); tercera persona o primera persona institucional. No inventes datos ni métricas: si falta información cuantitativa, dejá placeholders como [Número] o [Monto] para que el usuario los complete.",
    "texto_medios": "GACETILLA DE PRENSA PARA MEDIOS. Tono periodístico objetivo, sin publicidad encubierta. El periodista debe poder publicarla directamente o usarla como base. IMPORTANTE: separá cada sección con DOS SALTOS DE LINEA (\\n\\n) para generar párrafos diferenciados. (1) ENCABEZADO: 'GACETILLA DE PRENSA – PARA PUBLICACIÓN INMEDIATA'. (2) LUGAR Y FECHA: epígrafe con ciudad y fecha (ej: 'Saladillo, Buenos Aires — [Fecha]'). (3) TITULAR INFORMATIVO: claro y llamativo, sin adjetivos exagerados (evitá 'increíble', 'maravilloso', 'único'). (4) SUBTÍTULO opcional que complemente el titular. (5) LEAD/ENTRADILLA: párrafo de máximo 4 líneas resumiendo las 6 preguntas: QUÉ es el evento o noticia, QUIÉNES son los expositores, proveedores o generadores, DÓNDE, CUÁNDO, CÓMO y POR QUÉ. (6) CUERPO: contá de qué trata el evento o noticia, su impacto esperado o logrado. Identificá a los expositores, proveedores o generadores mencionando sus nombres y roles. Priorizá hechos concretos. (7) PRÓXIMOS EVENTOS Y PROYECTOS EN DESARROLLO: mencioná brevemente qué actividades, proyectos o iniciativas tiene planificadas ITEC en el corto y mediano plazo, para dar contexto periodístico amplio. (8) CITA TEXTUAL ATRIBUIBLE de protagonista/autoridad de ITEC, entre comillas dobles, con formato '\"...\", expresó [Nombre y Apellido], [Cargo] de ITEC.' (9) CIERRE: materiales y fotos disponibles para descarga. (10) ACERCA DE ITEC: párrafo de 2-3 líneas describiendo qué es ITEC, su misión y qué hace como institución. (11) CONTACTO DE PRENSA con placeholders: 'Nombre: [Nombre del responsable] / Cargo: [Cargo] / Teléfono: [Número] / Correo: [Email] / Web: [URL]'. CRÍTICO: NO incluyas información de comunicación interna (agradecimientos al equipo, cosas para mejorar, retrospectiva). NO incluyas balance económico del evento. Esta nota es informativa y periodística. REGLAS: SIN emojis (es comunicación formal con medios); tercera persona estricta; lenguaje claro y fáctico sin adjetivos subjetivos; nunca uses palabras prohibidas del system prompt; no inventes datos, usá placeholders si falta información.",
  }

  Respondé ÚNICAMENTE con el JSON, sin markdown, sin bloques de código, sin texto antes o después.

  NOTAS CRUDAS: """${rawFacts}"""`

  const raw = await callOpenRouter([
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

  const result = await callOpenRouter([
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