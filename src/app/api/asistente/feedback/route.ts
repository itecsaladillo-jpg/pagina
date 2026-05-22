import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
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

// Inicialización del cliente de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY || '' });

// ─────────────────────────────────────────────
// POST /api/asistente/feedback
// ─────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Validar claves del servidor
    if (!process.env.GEMINI_API_KEY_3 && !process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: 'La API key de Gemini no está configurada en el servidor.' },
        { status: 500 },
      );
    }

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

        const respuestaIa = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: promptConsolidacion,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1, // Baja temperatura para análisis consistentes
            maxOutputTokens: 512,
          },
        });

        const textoIa = respuestaIa.text;
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
            console.error('[Asistente ITEC] Error al parsear JSON sintetizado por Gemini:', parseError, textoIa);
          }
        }
      } catch (geminiError) {
        console.error('[Asistente ITEC] Error al consolidar aprendizaje con Gemini:', geminiError);
        temaPrincipal = 'Error al sintetizar con IA';
        loMasUtil = 'Error al sintetizar con IA';
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
