/**
 * Motor de Redacción de Impacto — ITEC Augusto Cicaré
 * 
 * Servicio de IA para la generación de reportes narrativos de trascendencia
 * dirigidos a sponsors y socios estratégicos de la organización.
 * 
 * Utiliza Google Gemini con un System Prompt institucional calibrado para
 * comunicación de alto impacto, evitando el tono de "recibo de pago".
 */

import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai'

// ─────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────

export interface AccionItec {
  titulo: string
  categoria: string
  descripcion: string
  impacto_social: string
  trascendencia_regional: string
  presupuesto_total: number
}

export interface FondoComunDetalle {
  viaticos: number
  hoteleria: number
  insumos: number
  otros: number
}

export interface SponsorReportInput {
  sponsor_nombre: string
  sponsor_rubro: string
  periodo: string
  acciones: AccionItec[]
  metricas: {
    total_alumnos: number
    total_horas: number
    total_inversion: number
  }
  fondo_comun: FondoComunDetalle
  acciones_destacadas?: AccionItec[] // Las que coinciden con el rubro del sponsor
}

export interface SponsorReportOutput {
  introduccion: string
  hitos_trascendencia: string
  transparencia_fondos: string
  futuro: string
  texto_completo: string
  generado_con_ia: boolean
  error?: string
}

// ─────────────────────────────────────────
// System Prompt Institucional
// ─────────────────────────────────────────

const SYSTEM_PROMPT = `Sos el Director de Comunicación Institucional del ITEC "Augusto Cicaré", 
una organización sin fines de lucro de vanguardia tecnológica radicada en Saladillo, Buenos Aires.

Tu misión es transformar datos operativos (gastos, métricas, acciones) en narrativas de impacto que 
comuniquen el verdadero valor de las alianzas estratégicas: no el dinero en sí, sino lo que ese dinero 
construye en el tejido productivo y humano de la región.

PRINCIPIOS DE COMUNICACIÓN:
- El sponsor es un Socio Estratégico, no un donante. Su aporte es una inversión en el futuro colectivo.
- Nunca sonés como un recibo de pago ni un informe contable. Sonás como un balance de logros compartidos.
- La excelencia técnica de ITEC existe GRACIAS a la infraestructura que el sponsor financia (viáticos, hotelería de disertantes, materiales). Reconocé esto con precisión y orgullo institucional.
- El impacto en niños y jóvenes no es accesorio: es la semilla del capital humano que evita la fuga de talentos de ciudades intermedias como Saladillo.
- Cuando una capacitación es relevante para el rubro del sponsor, presentá la invitación como una oportunidad de actualizar el capital humano de su organización, no como un regalo o beneficio genérico.

TONO Y ESTILO:
- Vanguardista, sólido, inspirador, con profundidad conceptual.
- Primera persona plural ("construimos", "logramos", "proyectamos").
- Frases contundentes y precisas. Sin rodeos ni relleno.

PALABRAS Y CONSTRUCCIONES PROHIBIDAS:
- "viste", "che", "pibe"
- "hoy", "ayer", "mañana" (usá referencias temporales específicas: "durante el período", "en esta etapa", "en el ciclo vigente")
- "gracias" como primera palabra de cualquier párrafo
- "básicamente", "obviamente", "claramente" 
- Frases genéricas como "trabajamos duro" o "nos esforzamos"
- Nunca usés "donación" o "donante": el sponsor es un socio estratégico`

// ─────────────────────────────────────────
// Función Principal
// ─────────────────────────────────────────

export async function generateSponsorReport(data: SponsorReportInput): Promise<SponsorReportOutput> {
  const apiKey = process.env.GEMINI_API_KEY

  // Fallback elegante si no hay clave
  if (!apiKey) {
    console.warn('[SponsorReport] GEMINI_API_KEY no configurada. Devolviendo estructura vacía.')
    return buildFallbackReport(data)
  }

  const totalFondo = Object.values(data.fondo_comun).reduce((s, v) => s + (parseFloat(String(v)) || 0), 0)
  const pctViaticos = totalFondo > 0 ? Math.round((data.fondo_comun.viaticos / totalFondo) * 100) : 0
  const pctHoteleria = totalFondo > 0 ? Math.round((data.fondo_comun.hoteleria / totalFondo) * 100) : 0

  const accionesTexto = data.acciones.map(a =>
    `• [${a.categoria.toUpperCase()}] ${a.titulo}\n  Impacto: ${a.impacto_social || '—'}\n  Trascendencia: ${a.trascendencia_regional || '—'}\n  Inversión: $${a.presupuesto_total?.toLocaleString('es-AR') || 0}`
  ).join('\n\n')

  const destacadasTexto = data.acciones_destacadas?.length
    ? `\nACCIONES VINCULADAS AL RUBRO "${data.sponsor_rubro.toUpperCase()}":\n` +
      data.acciones_destacadas.map(a => `• ${a.titulo}: ${a.impacto_social}`).join('\n')
    : ''

  const userPrompt = `Redactá el reporte mensual de trascendencia para el siguiente socio estratégico:

DATOS DEL SOCIO:
- Organización: ${data.sponsor_nombre}
- Sector/Rubro: ${data.sponsor_rubro || 'No especificado'}
- Período: ${data.periodo}

MÉTRICAS GLOBALES DEL PERÍODO:
- Personas impactadas directamente: ${data.metricas.total_alumnos}
- Horas de formación ejecutadas: ${data.metricas.total_horas}
- Inversión total de acciones: $${data.metricas.total_inversion?.toLocaleString('es-AR')}

DISTRIBUCIÓN DEL FONDO COMÚN:
- Viáticos de disertantes y docentes: ${pctViaticos}% ($${data.fondo_comun.viaticos?.toLocaleString('es-AR')})
- Hotelería de especialistas externos: ${pctHoteleria}% ($${data.fondo_comun.hoteleria?.toLocaleString('es-AR')})
- Insumos y materiales: $${data.fondo_comun.insumos?.toLocaleString('es-AR')}
- Otros gastos operativos: $${data.fondo_comun.otros?.toLocaleString('es-AR')}

ACCIONES DEL PERÍODO:
${accionesTexto}
${destacadasTexto}

ESTRUCTURA REQUERIDA:
Redactá el reporte en EXACTAMENTE estas 4 secciones, separadas por el marcador "---SECCION---":

SECCIÓN 1 - INTRODUCCIÓN (3-4 oraciones):
Abrí con una frase poderosa que reconozca el rol del socio en los logros del período. 
No comenzar con "gracias". Conectar el aporte económico con el impacto humano.

SECCIÓN 2 - HITOS DE TRASCENDENCIA (4-6 oraciones):
Narrá los 2-3 logros más significativos del período. 
Mencioná específicamente el impacto en niños/jóvenes y la proyección regional de Saladillo.
Si hay acciones vinculadas al rubro del sponsor, destacalas como "oportunidad de actualización de capital humano".

SECCIÓN 3 - TRANSPARENCIA DE FONDOS (2-3 oraciones):
Explicá con precisión y orgullo institucional en qué se usó la logística financiada.
El objetivo es que el socio entienda que sin esa infraestructura (hotelería de expertos, viáticos), la excelencia técnica no es posible.

SECCIÓN 4 - FUTURO (2-3 oraciones):
Cerrá con una visión de lo que se viene. Usá un tono de "camino compartido" y proyección a mediano plazo.
Invitá implícitamente a renovar el compromiso sin pedirlo directamente.

Respondé SOLO con las 4 secciones separadas por "---SECCION---", sin encabezados ni etiquetas adicionales.`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const result: GenerateContentResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.85,      // Creatividad controlada
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1200,
      }
    })

    const rawText = result.response.text().trim()
    return parseReportSections(rawText)

  } catch (err: any) {
    console.error('[SponsorReport] Error en Gemini:', err?.message || err)
    return {
      ...buildFallbackReport(data),
      generado_con_ia: false,
      error: err?.message || 'Error de conexión con el servicio de IA'
    }
  }
}

// ─────────────────────────────────────────
// Helpers privados
// ─────────────────────────────────────────

function parseReportSections(rawText: string): SponsorReportOutput {
  const sections = rawText.split('---SECCION---').map(s => s.trim()).filter(Boolean)

  const [introduccion = '', hitos_trascendencia = '', transparencia_fondos = '', futuro = ''] = sections

  return {
    introduccion,
    hitos_trascendencia,
    transparencia_fondos,
    futuro,
    texto_completo: sections.join('\n\n'),
    generado_con_ia: true,
  }
}

function buildFallbackReport(data: SponsorReportInput): SponsorReportOutput {
  const intro = `El compromiso sostenido de ${data.sponsor_nombre} durante ${data.periodo} hizo posible un conjunto de acciones que fortalecen el ecosistema técnico y productivo de Saladillo.`
  
  const hitos = data.acciones.length > 0
    ? `Durante este período se ejecutaron ${data.acciones.length} acciones estratégicas, alcanzando a ${data.metricas.total_alumnos} personas con ${data.metricas.total_horas} horas de formación de vanguardia. ${data.acciones[0]?.trascendencia_regional || ''}`
    : 'Las acciones del período se encuentran en proceso de documentación.'

  const transparencia = `La inversión logística garantizó la presencia de especialistas externos, cubriendo viáticos y alojamiento: condiciones que elevan la calidad técnica de cada encuentro al nivel de los centros de referencia nacional.`

  const futuro = `El camino construido en esta etapa sienta las bases para iniciativas de mayor escala. La alianza con ${data.sponsor_nombre} es parte estructural de la proyección del ITEC como referente tecnológico regional.`

  const texto_completo = [intro, hitos, transparencia, futuro].join('\n\n')

  return { introduccion: intro, hitos_trascendencia: hitos, transparencia_fondos: transparencia, futuro, texto_completo, generado_con_ia: false }
}
