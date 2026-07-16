import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'

function limpiarJSON(texto: string): string {
  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function generarTextosIA(datos_crudos: string) {
  const prompt = `Actuá como un Director de Comunicaciones Estratégicas experto. Tu misión es transformar "datos crudos" en 4 piezas de comunicación con identidades totalmente divergentes.

RESTRICCIONES CRÍTICAS:
1. Responde ÚNICAMENTE con un JSON válido.
2. NO incluyas introducciones, comentarios ni etiquetas markdown (```json).
3. NO menciones constantemente a Augusto Cicaré; solo si es indispensable para el contexto histórico.
4. NUNCA inventes datos; si falta información, redacta en torno a los hechos disponibles.

ESTRUCTURA DE RESPUESTA (JSON):
{
  "titulo": "Titular periodístico de alto impacto (máx. 10 palabras).",
  
  "texto_publico": "ROL: Periodista social. OBJETIVO: Generar orgullo y pertenencia en Saladillo. TONO: Aspiracional, accesible y humano. ENFOQUE: Traducir la técnica a beneficios comunitarios. Estructura de pirámide invertida. Evitá tecnicismos. Cerrá con una frase que invite a sumarse al ecosistema ITEC.",
  
  "texto_miembros": "ROL: Líder de equipo / Gestor interno. OBJETIVO: Reconocimiento y motivación. TONO: Cálido, entusiasta y muy cercano. ENFOQUE: Resaltá el 'quiénes' y el esfuerzo voluntario. Usá 'nosotros' y 'nuestro'. Celebrá los desafíos técnicos superados como una victoria colectiva.",
  
  "texto_sponsors": "ROL: Analista de Proyectos / Ejecutivo. OBJETIVO: Reportar ROI social y eficiencia. TONO: Pragmático, profesional y de rendición de cuentas. ENFOQUE: Impacto en el mapa productivo local, métricas de asistencia y eficiencia en el uso de los fondos (gastos vs. resultados). Destacá la alianza estratégica.",
  
  "texto_medios": "ROL: Jefe de Prensa. OBJETIVO: Publicación inmediata (Copy/Paste). TONO: Institucional, seco y fáctico. ESTRUCTURA: Título + Bajada (Qué, Quién, Cuándo, Dónde) + Cuerpo breve + Cita simulada de autoridad de ITEC resaltando el hito."
}

DATOS CRUDOS PARA PROCESAR: ${datos_crudos}`

  try {
    console.log('[IA] Llamando a Groq con prompt length:', prompt.length)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 1500
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }
    
    const result = await response.json()
    const raw = limpiarJSON(result.choices[0]?.message?.content?.trim() || '{}')
    console.log('[IA] Respuesta cruda:', raw.substring(0, 500))
    
    const parsed = JSON.parse(raw)
    
    let textos = {
      titulo: parsed.titulo || 'Novedad ITEC',
      texto_publico: parsed.texto_publico || '',
      texto_miembros: parsed.texto_miembros || '',
      texto_sponsors: parsed.texto_sponsors || '',
      texto_medios: parsed.texto_medios || ''
    }
    
    const todosIguales = textos.texto_publico && 
      textos.texto_publico === textos.texto_miembros && 
      textos.texto_publico === textos.texto_sponsors && 
      textos.texto_publico === textos.texto_medios
    
    if (todosIguales) {
      console.log('[IA] Textos idénticos, aplicando variación:', textos.texto_publico.substring(0, 50))
      textos = {
        titulo: textos.titulo,
        texto_publico: textos.texto_publico,
        texto_miembros: '¡Equipo! ' + textos.texto_miembros + '\n\nGracias a quienes hicieron posible este logro.',
        texto_sponsors: 'ROI destacado: ' + textos.texto_sponsors + '\n\nImpacto en el ecosistema local.',
        texto_medios: 'ITEC informa: ' + textos.texto_medios + '. "Un paso más hacia la innovación", comentó la institución.'
      }
    }
    
    console.log('[IA] Textos generados:', {
      titulo_len: textos.titulo.length,
      publico_len: textos.texto_publico.length,
      miembros_len: textos.texto_miembros.length,
      sponsors_len: textos.texto_sponsors.length,
      medios_len: textos.texto_medios.length
    })
    
    return textos
  } catch (err: any) {
    console.error('[IA] Error:', err.message)
    return {
      titulo: 'Novedad ITEC',
      texto_publico: datos_crudos + '\n\nEsta iniciativa fortalece el acceso a la tecnología para toda la comunidad saladense.',
      texto_miembros: '¡Equipo! ' + datos_crudos + '\n\nGracias a quienes hicieron posible este logro. Nuestro trabajo voluntario transforma realidades.',
      texto_sponsors: 'Evento con impacto en el ecosistema local. Destacan los ' + (datos_crudos.length > 50 ? datos_crudos.substring(0, 50) + '...' : datos_crudos),
      texto_medios: 'ITEC Saladillo realizó actividad comunitaria. ' + datos_crudos + '. "Un paso más hacia la vinculación tecnológica", comentó la institución.'
    }
  }
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { datos_crudos } = body

  if (!datos_crudos || datos_crudos.length < 20) {
    return NextResponse.json({ error: 'Los datos crudos son obligatorios y deben tener al menos 20 caracteres' }, { status: 400 })
  }

  try {
    const textos = await generarTextosIA(datos_crudos)
    return NextResponse.json({ success: true, result: textos })
  } catch (err: any) {
    return NextResponse.json({ error: 'Error de conexión: ' + (err.message || 'Error desconocido') }, { status: 500 })
  }
}