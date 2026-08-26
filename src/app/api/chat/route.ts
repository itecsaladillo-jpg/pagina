import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { recuperarContextoRAG } from '@/lib/rag/ragCascade';
import { FALLBACK_PROMPT, ANTI_HALLUCINATION_RULES_STRICT } from '@/lib/ai/constants';

// ============================================================
// Configuración
// ============================================================

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

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

  // ago 2026: las 4 queries corren en paralelo (antes en serie — latencia
  // directa del chatbot público). Los errores de cada una no bloquean a las demás.
  const [comisionesRes, miembrosRes, accionesRes, notasRes] = await Promise.allSettled([
    supabase
      .from('commissions')
      .select('name, description')
      .eq('is_active', true)
      .order('name'),
    supabase.rpc('obtener_miembros_publicos'),
    supabase
      .from('itec_actions')
      .select('title, type, status, start_date, description')
      .in('status', ['planificacion', 'en_curso'])
      .order('start_date', { ascending: true })
      .limit(10),
    supabase
      .from('notas_publico')
      .select('titulo, contenido, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Comisiones activas
  if (comisionesRes.status === 'fulfilled') {
    const { data } = comisionesRes.value;
    if (data?.length) {
      sections.push(
        '## Comisiones / Áreas de ITEC\n' +
        data.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')
      );
    }
  } else {
    console.warn('[chat] Error fetching commissions:', comisionesRes.reason);
  }

  // Staff
  if (miembrosRes.status === 'fulfilled') {
    const { data } = miembrosRes.value;
    if (data?.length) {
      sections.push(
        '## Staff de ITEC\n' +
        data
          .filter((m: any) => m.role !== 'asistente')
          .map((m: any) => `- ${m.full_name} (${m.role})${m.frase_itec ? ` — "${m.frase_itec}"` : ''}`)
          .join('\n')
      );
    }
  } else {
    console.warn('[chat] Error fetching members:', miembrosRes.reason);
  }

  // Próximas actividades
  if (accionesRes.status === 'fulfilled') {
    const { data } = accionesRes.value;
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
  } else {
    console.warn('[chat] Error fetching actions:', accionesRes.reason);
  }

  // Noticias recientes
  if (notasRes.status === 'fulfilled') {
    const { data } = notasRes.value;
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
  } else {
    console.warn('[chat] Error fetching notes:', notasRes.reason);
  }

  return sections.join('\n\n');
}

// ============================================================
// POST /api/chat — Streaming con Groq openai/gpt-oss-20b
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawMessages = body.messages as Array<{ role: string; content: string }> || [];
    const userMessage = body.message as string;
    const sessionId = body.sessionId as string | undefined;

    if (!userMessage?.trim()) {
      return new Response(JSON.stringify({ error: 'Mensaje requerido' }), { status: 400 });
    }

    // ── 1. Limpiar mensajes del cliente: eliminar CUALQUIER role === 'system' ──
    const userMessages = rawMessages.filter((m: { role: string }) => m.role !== 'system');

    // ── 2. Obtener Prompt Maestro + Datos dinámicos en paralelo ──
    const [promptMaestro, datosDinamicos] = await Promise.all([
      fetchPromptMaestro(),
      fetchDynamicContext(),
    ]);

    // ── 3. Obtener contexto RAG desde pgvector ──
    const supabase = await createClient();
    const ragResult = await recuperarContextoRAG(userMessage, supabase, sessionId);

    // ── 4. Ensamblar System Prompt: Prompt Maestro + Anti-Alucinación + RAG ──
    const retrievedContext = ragResult.contexto
      || 'No se encontraron fragmentos específicos en la base vectorial para esta consulta.';

    const systemPrompt = `${promptMaestro}

${ANTI_HALLUCINATION_RULES_STRICT}

<retrieved_context>
${retrievedContext}
</retrieved_context>

--- DATOS EN VIVO ---
${datosDinamicos || '(No hay datos dinámicos disponibles en este momento)'}
--------------------`;

    // ── 5. Construir array final: UN solo system + historial limpio + último mensaje ──
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      })),
    ];

    // ── 6. Streaming con Groq openai/gpt-oss-20b ──
    const stream = await getGroq().chat.completions.create({
      messages,
      model: 'openai/gpt-oss-20b',
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
