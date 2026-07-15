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
  const prompt = `Actuá como Director de Comunicaciones Estratégicas para ITEC Saladillo. Responde SOLO con un JSON válido, sin markdown:

{
  "titulo": "título atractivo máximo 10 palabras",
  "texto_publico": "3-6 oraciones. TONO ASPIRACIONAL para vecinos de Saladillo. Ej: '¡Vieron lo que pasó! Más de X vecinos se dieron cita en ITEC...' Destacar impacto comunitario.",
  "texto_miembros": "3-6 oraciones. TONO INTERNO cálido. Ej: '¡Equipo, qué semana! Gracias a la movida de ayer...' Usar 'nosotros', agradecer voluntarios.",
  "texto_sponsors": "3-6 oraciones. TONO EJECUTIVO pragmático. Ej: 'El taller movilizó X nuevos contactos...' Mostrar métricas y ROI.",
  "texto_medios": "GACETILLA: Titular + bajada (quién, qué, cuándo, dónde) + cita. Texto breve listo para publicar."
}

EVENTO: ${datos_crudos}`

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