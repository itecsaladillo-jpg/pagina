import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';
import docsContext from '@/lib/docsContext.json';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
          const preview = n.contenido.length > 300 ? n.contenido.slice(0, 300) + '…' : n.contenido;
          return `- [${fecha}] ${n.titulo}: ${preview}`;
        }).join('\n')
      );
    }
  } catch (err) {
    console.warn('[chat] Error fetching notas:', err);
  }

  return sections.join('\n\n');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const datosDinamicos = await fetchDynamicContext();

    const systemPrompt = `Eres el asistente virtual oficial de ITEC, experto en Augusto Cicaré.
Usa la siguiente información para responder preguntas de manera precisa y amigable.
Si no sabes la respuesta, indícalo de manera cortés y sugiere contactar a la institución.

--- INFORMACIÓN DE BASE ---
${docsContext.text}
----------------------------

--- DATOS EN VIVO ---
${datosDinamicos || '(No hay datos dinámicos disponibles en este momento)'}
----------------------------`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 500
    });

    const reply = chatCompletion.choices[0]?.message?.content || 'Sin respuesta.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error en API route:', error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}
