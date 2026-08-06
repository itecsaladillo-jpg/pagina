import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { recuperarContextoRAG } from '@/lib/rag/ragCascade';

// ============================================================
// Configuración
// ============================================================

const FALLBACK_PROMPT = `Sos el asistente virtual oficial de ITEC (Instituto Tecnológico de Saladillo), experto en Augusto Cicaré y su obra.

IDENTIDAD:
- Nombre: Asistente ITEC
- Institución: Instituto Tecnológico de Saladillo (ITEC)
- Especialización: Augusto Cicaré, Expo ITEC, actividad institucional

REGLAS GENERALES:
- Respondé en español rioplatense formal (con "vos").
- Sé directo, conciso y útil.
- Si no sabés la respuesta, indicá de forma amable y sugerí contactar a la institución.`;

const ANTI_HALLUCINATION_RULES = `
REGLAS OBLIGATORIAS DE CONTEXTO (RAG):
1. Respondé ÚNICAMENTE utilizando la información provista dentro del bloque <retrieved_context>.
2. Si la respuesta a la pregunta del usuario NO se encuentra contenida en <retrieved_context>, respondé de forma amable: "No dispongo de esa información específica en los documentos oficiales cargados. Por favor, consultá directamente con la administración del ITEC."
3. Queda estrictamente PROHIBIDO inventar fechas, requisitos, programas o normativas que no figuren explícitamente en el contexto.`;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// 1. Obtener Prompt Maestro desde Supabase
// ============================================================
// Tabla: ai_prompt_settings
// Columna: system_prompt
// Filtro: clave_prompt = 'asistente_global'
// RLS: SELECT público (using (true))
// ============================================================

async function fetchPromptMaestro(): Promise<string> {
  try {
    // Usar service role key para garantizar acceso (bypass RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('ai_prompt_settings')
      .select('system_prompt')
      .eq('clave_prompt', 'asistente_global')
      .maybeSingle();

    if (error) {
      console.error("⚠️ ERROR O PROMPT VACÍO AL LEER DE SUPABASE. Revisar RLS o clave.", error.message);
      return FALLBACK_PROMPT;
    }

    if (!data?.system_prompt) {
      console.error("⚠️ ERROR O PROMPT VACÍO AL LEER DE SUPABASE. Revisar RLS o clave.");
      return FALLBACK_PROMPT;
    }

    console.log("📌 PROMPT MAESTRO CARGADO DESDE DB:\n", data.system_prompt.slice(0, 200) + '...');
    return data.system_prompt;
  } catch (err) {
    console.error("⚠️ ERROR O PROMPT VACÍO AL LEER DE SUPABASE. Revisar RLS o clave.", err);
    return FALLBACK_PROMPT;
  }
}

// ============================================================
// 2. Obtener datos dinámicos de Supabase
// ============================================================

async function fetchDynamicContext(): Promise<string> {
  const supabase = await createClient();
  const sections: string[] = [];

  // Comisiones activas
  try {
    const { data } = await supabase
      .from('commissions')
      .select('name, description')
      .eq('is_active', true)
      .order('name');

    if (data?.length) {
      sections.push(
        '## Comisiones / Áreas de ITEC\n' +
        data.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching commissions:', err);
  }

  // Staff
  try {
    const { data } = await supabase.rpc('obtener_miembros_publicos');
    if (data?.length) {
      sections.push(
        '## Staff de ITEC\n' +
        data
          .filter((m: any) => m.role !== 'asistente')
          .map((m: any) => `- ${m.full_name} (${m.role})${m.frase_itec ? ` — "${m.frase_itec}"` : ''}`)
          .join('\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching members:', err);
  }

  // Próximas actividades
  try {
    const { data } = await supabase
      .from('itec_actions')
      .select('title, type, status, start_date, description')
      .in('status', ['planificacion', 'en_curso'])
      .order('start_date', { ascending: true })
      .limit(10);

    if (data?.length) {
      sections.push(
        '## Próximas actividades / Eventos\n' +
        data.map((a) => {
          const fecha = a.start_date
            ? new Date(a.start_date).toLocaleDateString('es-AR')
            : 'fecha a confirmar';
          return `- [${a.type}] ${a.title} (${fecha})${a.description ? ` — ${a.description.slice(0, 200)}` : ''}`;
        }).join('\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching actions:', err);
  }

  // Noticias recientes
  try {
    const { data } = await supabase
      .from('notas_publico')
      .select('titulo, contenido, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data?.length) {
      sections.push(
        '## Noticias recientes\n' +
        data.map((n) => {
          const fecha = n.created_at ? new Date(n.created_at).toLocaleDateString('es-AR') : '';
          const preview = n.contenido.length > 300 ? n.contenido.slice(0, 300) + '…' : n.contenido;
          return `- [${fecha}] ${n.titulo}: ${preview}`;
        }).join('\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching noticias:', err);
  }

  return sections.join('\n\n');
}

// ============================================================
// POST /api/chat — Streaming con Groq llama-3.3-70b-versatile
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userMessage = body.message as string;
    const historial: { rol: string; texto: string }[] = body.historial || [];
    const sessionId = body.sessionId as string | undefined;

    if (!userMessage?.trim()) {
      return new Response(JSON.stringify({ error: 'Mensaje requerido' }), { status: 400 });
    }

    // ── 1. Obtener Prompt Maestro + Datos dinámicos en paralelo ──
    const [, datosDinamicos] = await Promise.all([
      fetchPromptMaestro(),
      fetchDynamicContext(),
    ]);

    // ── 2. Obtener contexto RAG desde pgvector ──
    const supabase = await createClient();
    const ragResult = await recuperarContextoRAG(userMessage, supabase, sessionId);

    // ── 3. TEST: System Prompt hardcodeado de pirata ──
    const systemPrompt = "INSTRUCCIÓN OBLIGATORIA: De ahora en adelante sos un PIRATA. Respondé a absolutamente todo en español neutro, usando muletillas de pirata como '¡Ahoy, grumete!' y '¡Por la barba de Barbanegra!'. NUNCA rompas el personaje.";

    console.log("SYSTEM PROMPT ENVIADO A GROQ:\n", systemPrompt);

    // ── 4. Preparar mensajes para Groq (filtrar cualquier system previo) ──
    const historialFiltrado = historial
      .slice(-20)
      .filter(m => m.rol !== 'system')
      .map(m => ({
        role: m.rol === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.texto,
      }));

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...historialFiltrado,
      { role: 'user', content: userMessage },
    ];

    // ── DEBUG RAG ──
    console.log('=== DEBUG RAG START ===');
    console.log('Pregunta:', userMessage);
    console.log('RAG Level:', ragResult.nivel, '| Score:', ragResult.score.toFixed(3));
    console.log('Contexto Recuperado:\n', ragResult.contexto || '⚠️ VACIO');
    console.log('=== DEBUG RAG END ===');

    // ── 5. Streaming con Groq llama-3.3-70b-versatile ──
    const stream = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1024,
      stream: true,
    });

    // ── 6. Convertir a ReadableStream para streaming nativo ──
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-RAG-Level': ragResult.nivel,
        'X-RAG-Score': ragResult.score.toFixed(3),
      },
    });
  } catch (error: any) {
    console.error('[chat] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
