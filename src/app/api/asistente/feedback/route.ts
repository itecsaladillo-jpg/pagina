import { createClient } from '@/lib/supabase/server';
import { generarEmbedding } from '@/services/ai';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────
// Tipos de la petición
// ─────────────────────────────────────────────
interface MensajeChat {
  role: 'user' | 'model';
  text: string;
}

interface CuerpoSolicitudFeedback {
  historial: MensajeChat[];
  calificacion: string;
  comentario?: string;
}

// Configuración Ollama
const OLLAMA_BASE_URL = process.env.OLLAMA_API_BASE_URL || 'https://ai.itecsaladillo.org.ar'
const OLLAMA_MODEL = 'llama3'

// ─────────────────────────────────────────────
// POST /api/asistente/feedback
// ─────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 2. Parsear y validar el cuerpo de la solicitud
    let cuerpo: CuerpoSolicitudFeedback;
    try {
      cuerpo = await request.json();
    } catch {
      return Response.json(
        { error: 'El cuerpo de la solicitud no es un JSON válido.' },
        { status: 400 },
      );
    }

    const { historial = [], calificacion, comentario = '' } = cuerpo;

    if (!calificacion || typeof calificacion !== 'string') {
      return Response.json(
        { error: 'El campo "calificacion" es requerido.' },
        { status: 400 },
      );
    }

    // 3. Evaluar si hay interacciones significativas del usuario
    const tieneInteraccionUsuario = historial.some((msg) => msg.role === 'user');

    let temaPrincipal = 'Sin interacción significativa';
    let loMasUtil = 'Sin interacción significativa';

    // 4. Consolidar el aprendizaje con IA si hay mensajes de usuario
    if (tieneInteraccionUsuario) {
      try {
        const promptConsolidacion = `
Analizá la siguiente conversación entre un usuario y el Asistente ITEC (el bot virtual del sitio web de ITEC Saladillo).
        
Tu tarea es extraer de forma muy concisa:
1. "tema_principal": Cuál fue el problema, duda o tema de consulta que trajo el usuario al chat.
2. "lo_mas_util": Qué información, explicación o recurso específico que le brindó el Asistente ITEC resultó de mayor utilidad, valor o causó una respuesta positiva/agradecimiento del usuario.

REGLA DE GÉNERO ABSOLUTA Y OBLIGATORIA:
- En tus descripciones, NUNCA utilices "el ITEC" o "la ITEC". ITEC no posee género gramatical. Utilizá fórmulas neutras como "ITEC", "de ITEC" o "a ITEC".

Formato de salida esperado (JSON puro):
{
  "tema_principal": "Breve descripción de la necesidad del usuario",
  "lo_mas_util": "Breve descripción de qué recurso o dato de ITEC le sirvió más"
}
        
Conversación a analizar:
${historial
  .map((msg) => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.text}`)
  .join('\n')}
        `.trim();

        const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [
              { 
                role: 'system', 
                content: 'Sos un asistente analítico. Respondés únicamente en formato JSON puro, sin markdown ni bloques de código.' 
              },
              { role: 'user', content: promptConsolidacion }
            ],
            stream: false,
            temperature: 0.1
          }),
        })

        if (!ollamaResponse.ok) {
          throw new Error(`Error en Ollama: ${ollamaResponse.status}`)
        }

        const data = await ollamaResponse.json()
        const textoIa = data.message?.content || ''
        
        if (textoIa) {
          try {
            const dataSintetizada = JSON.parse(textoIa) as {
              tema_principal?: string;
              lo_mas_util?: string;
            };
            if (dataSintetizada.tema_principal) {
              temaPrincipal = dataSintetizada.tema_principal.trim();
            }
            if (dataSintetizada.lo_mas_util) {
              loMasUtil = dataSintetizada.lo_mas_util.trim();
            }
          } catch (parseError) {
            console.error('[Asistente ITEC] Error al parsear JSON sintetizado por Ollama:', parseError, textoIa);
          }
        }
      } catch (ollamaError) {
        console.error('[Asistente ITEC] Error al consolidar aprendizaje con Ollama:', ollamaError);
        temaPrincipal = 'Error al sintetizar con IA';
        loMasUtil = 'Error al sintetizar con IA';
      }
    }

    // Generar embedding para posibilitar la búsqueda semántica posterior (RAG)
    let embeddingVal = null;
    if (
      tieneInteraccionUsuario &&
      temaPrincipal &&
      temaPrincipal !== 'Sin interacción significativa' &&
      temaPrincipal !== 'Error al sintetizar con IA' &&
      (calificacion === 'muy_util' || calificacion === 'util')
    ) {
      try {
        const textoParaEmbedding = `${temaPrincipal} ${loMasUtil}`.trim();
        embeddingVal = await generarEmbedding(textoParaEmbedding);
      } catch (embError) {
        console.error('[Asistente Feedback] Error al generar embedding para aprendizaje:', embError);
      }
    }

    // 5. Guardar en Supabase
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('asistente_feedback')
      .insert({
        historial,
        calificacion,
        comentario: comentario.trim() || null,
        tema_principal: temaPrincipal,
        lo_mas_util: loMasUtil,
        embedding: embeddingVal,
      });

    if (dbError) {
      console.error('[Asistente ITEC] Error al guardar feedback en Supabase:', dbError);
      return Response.json(
        { error: 'Error técnico al persistir el feedback.' },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      data: {
        tema_principal: temaPrincipal,
        lo_mas_util: loMasUtil,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido del servidor.';
    console.error('[Asistente ITEC] Error inesperado en endpoint de feedback:', msg);
    return Response.json(
      { error: 'Ocurrió un error inesperado al procesar tu feedback.' },
      { status: 500 },
    );
  }
}
