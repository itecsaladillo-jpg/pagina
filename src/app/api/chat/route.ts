import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import { createClient } from '@/lib/supabase/server';
import { recuperarContextoRAG } from '@/lib/rag/ragCascade';

// ============================================================
// Configuración
// ============================================================

const FALLBACK_PROMPT = `Sos el asistente virtual oficial de ITEC (Instituto Tecnológico de Saladillo), experto en Augusto Cicaré y su obra.

REGLAS:
- Respondé en español rioplatense formal (con "vos").
- Priorizá la información de los documentos institucionales.
- No inventes datos. Si no sabés la respuesta, dilo claramente y sugerí contactar a la institución.
- Sé directo, conciso y útil.`;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// Obtener Prompt Maestro desde Supabase
// ============================================================

async function fetchPromptMaestro(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ai_prompt_settings')
      .select('system_prompt, temperature, max_tokens')
      .eq('clave_prompt', 'asistente_global')
      .maybeSingle();

    if (error) {
      console.warn('[chat] Error fetching prompt maestro:', error.message);
      return FALLBACK_PROMPT;
    }

    if (!data?.system_prompt) {
      console.warn('[chat] Prompt maestro vacío, usando fallback');
      return FALLBACK_PROMPT;
    }

    return data.system_prompt;
  } catch (err) {
    console.error('[chat] Excepción fetching prompt maestro:', err);
    return FALLBACK_PROMPT;
  }
}

// ============================================================
// Obtener datos dinámicos de Supabase
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

    // 1. Obtener Prompt Maestro + Datos dinámicos en paralelo
    const [promptMaestro, datosDinamicos] = await Promise.all([
      fetchPromptMaestro(),
      fetchDynamicContext(),
    ]);

    // 2. Obtener contexto RAG desde pgvector
    const supabase = await createClient();
    const ragResult = await recuperarContextoRAG(userMessage, supabase, sessionId);

    // 3. Construir el system prompt combinado
    const ragSection = ragResult.contexto
      ? `\n<retrieved_context>\n${ragResult.contexto}\n</retrieved_context>\n`
      : '';

    const dynamicSection = datosDinamicos
      ? `\n--- DATOS EN VIVO ---\n${datosDinamicos}\n--------------------\n`
      : '';

    const systemPrompt = `${promptMaestro}
${ragSection}${dynamicSection}`;

    // 4. Preparar mensajes para Groq
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...historial.slice(-20).map(m => ({
        role: m.rol === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.texto,
      })),
      { role: 'user', content: userMessage },
    ];

    // 5. Streaming con Groq llama-3.3-70b-versatile
    const stream = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1024,
      stream: true,
    });

    // 6. Convertir a ReadableStream para streaming nativo
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
