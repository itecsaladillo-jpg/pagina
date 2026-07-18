import aiConfig from '@/config/aiConfig.json';
import { createClient } from '@/lib/supabase/server';
import { buscarFeedbacksSimilares, auditarRespuestaIA } from '@/services/ai';
import { getAIPrompt } from '@/services/admin';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────
// Configuración
const OLLAMA_URL = process.env.OLLAMA_API_BASE_URL || 'https://ai.itecsaladillo.org.ar';

// Mantenemos tu instrucción de sistema original (asegúrate de incluir todo el texto)
const SYSTEM_INSTRUCTION = `Sos el Asistente ITEC...`; 

interface MensajeChat {
  role: 'user' | 'model';
  text: string;
}

interface CuerpoSolicitud {
  mensaje: string;
  historial?: MensajeChat[];
  idioma?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  let cuerpo: CuerpoSolicitud;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { mensaje, historial = [], idioma } = cuerpo;

  if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
    return Response.json({ error: 'Mensaje requerido' }, { status: 400 });
  }

  // 1. Contexto (RAG + Miembros)
  let aprendizajesAdicionales = '';
  try {
    const feedbacks = await buscarFeedbacksSimilares(mensaje, 5, 0.35);
    if (feedbacks?.length > 0) {
      aprendizajesAdicionales = `\n\n## Aprendizaje Comunitario:\n${feedbacks.map(f => `- ${f.tema_principal} -> ${f.lo_mas_util}`).join('\n')}`;
    }
  } catch (err) { console.error(err); }

  let miembrosContext = '';
  try {
    const supabase = await createClient();
    const { data: miembros } = await supabase.rpc('obtener_miembros_publicos');
    if (miembros?.length > 0) {
      miembrosContext = `\n\n## Staff ITEC:\n${miembros.map((m: any) => `- ${m.full_name}: ${m.role}`).join('\n')}`;
    }
  } catch (err) { console.error(err); }

  // 2. Prompt y Configuración
  let promptSistema = SYSTEM_INSTRUCTION;
  try {
    const promptConfig = await getAIPrompt('asistente_global');
    if (promptConfig) promptSistema = promptConfig.system_prompt;
  } catch (err) { console.warn(err); }

  // 3. Llamada a Ollama con configuración dinámica
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: aiConfig.model, // Usamos la configuración del JSON
        messages: [
          { role: 'system', content: promptSistema + aprendizajesAdicionales + miembrosContext },
          ...historial.map(m => ({ role: m.role, content: m.text })),
          { role: 'user', content: mensaje }
        ],
        stream: false,
        options: {
          temperature: aiConfig.temperature,
          num_ctx: aiConfig.num_ctx,
          top_p: aiConfig.top_p
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en Ollama: ${errorText}`);
    }

    const data = await response.json();
    const textoRespuesta = data.message.content;

    // 4. Auditoría y respuesta
    const resultadoAuditoria = await auditarRespuestaIA(mensaje, textoRespuesta);

    return Response.json({
      respuesta: resultadoAuditoria.respuestaFinal,
      modelo: aiConfig.model,
    });

  } catch (error: any) {
    console.error('[Asistente ITEC] Error en Ollama:', error);
    return Response.json(
      { error: 'No se pudo contactar con la IA local. ' + error.message },
      { status: 502 }
    );
  }
}