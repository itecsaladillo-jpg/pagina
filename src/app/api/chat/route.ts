import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';
import docsContext from '@/lib/docsContext.json';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function searchWeb(query: string): Promise<string> {
  try {
    const resp = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const html = await resp.text();
    const results: string[] = [];
    const regex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;
    let i = 0;
    while ((match = regex.exec(html)) !== null && i < 3) {
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      results.push(`${title} (${match[1]})`);
      i++;
    }
    return results.length ? results.join('\n') : '';
  } catch {
    return '';
  }
}

function extractKeywords(message: string): string {
  const cleaned = message.replace(/[^\w\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 3);
  return words.slice(0, 6).join(' ');
}

async function fetchDynamicContext() {
  const supabase = await createClient();
  const sections: string[] = [];

  try {
    const { data: commissions } = await supabase
      .from('commissions')
      .select('name, description, color')
      .eq('is_active', true)
      .order('name');

    if (commissions?.length) {
      sections.push(
        '## Comisiones / Áreas de ITEC\n' +
        commissions.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching commissions:', err);
  }

  try {
    const { data: miembros } = await supabase.rpc('obtener_miembros_publicos');
    if (miembros?.length) {
      sections.push(
        '## Staff de ITEC\n' +
        miembros
          .filter((m: any) => m.role !== 'asistente')
          .map((m: any) => `- ${m.full_name} (${m.role})${m.frase_itec ? ` — "${m.frase_itec}"` : ''}`)
          .join('\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching members:', err);
  }

  try {
    const { data: actions } = await supabase
      .from('itec_actions')
      .select('title, type, status, start_date, end_date, description, location, target_audience')
      .in('status', ['planificacion', 'en_curso'])
      .order('start_date', { ascending: true })
      .limit(10);

    if (actions?.length) {
      sections.push(
        '## Próximas actividades / Eventos\n' +
        actions.map((a) => {
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

  try {
    const { data: notas } = await supabase
      .from('notas_publico')
      .select('titulo, contenido, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notas?.length) {
      sections.push(
        '## Noticias recientes\n' +
        notas.map((n) => {
          const fecha = n.created_at ? new Date(n.created_at).toLocaleDateString('es-AR') : '';
          const preview = n.contenido.length > 300 ? n.contenido.slice(0, 300) + '\u2026' : n.contenido;
          return `- [${fecha}] ${n.titulo}: ${preview}`;
        }).join('\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching notas:', err);
  }

  try {
    const { data: conversaciones } = await supabase
      .from('chat_conocimiento')
      .select('historial, tipo')
      .order('created_at', { ascending: false })
      .limit(5);

    if (conversaciones?.length) {
      sections.push(
        '## Conversaciones relevantes guardadas\n' +
        conversaciones.map((c: any) => {
          const msgs = (c.historial || []) as { rol: string; texto: string }[];
          const resumen = msgs.slice(0, 4).map(m =>
            `${m.rol === 'user' ? 'Usuario' : 'Asistente'}: ${m.texto.slice(0, 150)}`
          ).join('\n');
          return `[${c.tipo === 'manual' ? 'Guardada manualmente' : 'Conversación relevante'}]\n${resumen}`;
        }).join('\n---\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching saved conversations:', err);
  }

  return sections.join('\n\n');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = body.message;
    const historial: { rol: string; texto: string }[] = body.historial || [];

    if (!userMessage) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    let internetContext = '';

    const keywords = extractKeywords(userMessage);
    if (keywords) {
      internetContext = await searchWeb(`ITEC Saladillo ${keywords}`);
    }

    const datosDinamicos = await fetchDynamicContext();

    const webSection = internetContext
      ? `\n--- INFORMACIÓN DE INTERNET (usar solo si no se encuentra en las fuentes anteriores) ---\n${internetContext}\n----------------------------\n`
      : '';

    const systemPrompt = `Eres el asistente virtual oficial de ITEC, experto en Augusto Cicaré.

ORDEN DE PRIORIDAD DE FUENTES:
1. INFORMACIÓN DE BASE (documentos institucionales de ITEC): usá esta como fuente principal y más confiable.
2. DATOS EN VIVO (comisiones, staff, actividades, noticias de ITEC): usá esta como fuente secundaria.
3. CONVERSACIONES GUARDADAS (interacciones previas consideradas relevantes): usá esta como fuente terciaria.
4. INFORMACIÓN DE INTERNET: solo si no encontraste respuesta en las fuentes anteriores, podés consultar datos de internet. En ese caso, indicá que la información proviene de búsqueda web.

Respondé de forma directa, concisa y sin rodeos. Priorizá la información útil en pocas líneas.
Si no sabes la respuesta, indícalo de manera cortés y sugiere contactar a la institución.

--- INFORMACIÓN DE BASE ---
${docsContext.text}
---------------------------

--- DATOS EN VIVO ---
${datosDinamicos || '(No hay datos dinámicos disponibles en este momento)'}
---------------------------
${webSection}--- REGLAS DE RESPUESTA ---
- Responde siempre en español rioplatense formal (con "vos").
- Si usaste información de internet (fuente 4), comienza tu respuesta con "Según información disponible en internet:".
- No inventes datos. Si no hay suficiente información de ninguna fuente, dilo claramente.`;

    const mensajesAPI = [
      { role: 'system', content: systemPrompt },
      ...historial.slice(-20).map(m => ({ role: m.rol === 'assistant' ? 'assistant' : 'user' as const, content: m.texto })),
      { role: 'user' as const, content: userMessage },
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: mensajesAPI,
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 300,
    });

    const reply = chatCompletion.choices[0]?.message?.content || 'Sin respuesta.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error en API route:', error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}
