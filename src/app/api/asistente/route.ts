import { NextRequest, NextResponse } from 'next/server';
import { buscarFeedbacksSimilares, auditarRespuestaIA } from '@/services/ai';
import { createClient } from '@/lib/supabase/server';
import { getAIPrompt } from '@/services/admin';

// Esto permite que la función corra en el Edge (más rápida, sin timeout de 10s)
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { action, mensaje, textoBase, historial = [] } = await req.json();

  try {
    // 1. OBTENCIÓN DE CONTEXTO (RAG + Staff)
    let contexto = '';
    try {
      const [feedbacks, supabase] = await Promise.all([
        buscarFeedbacksSimilares(mensaje, 3, 0.35).catch(() => []),
        createClient()
      ]);
      const { data: miembros } = await supabase.rpc('obtener_miembros_publicos');
      
      if (feedbacks?.length > 0) contexto += `\nAprendizaje: ${feedbacks.map(f => f.tema_principal).join(', ')}`;
      if (miembros?.length > 0) contexto += `\nStaff ITEC: ${miembros.map((m: any) => m.full_name).join(', ')}`;
    } catch (e) { console.error("Error al obtener contexto", e); }

    // 2. LÓGICA DE ASISTENTE (GROQ)
    if (action === 'chat') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: `Sos el Asistente ITEC. Contexto:${contexto}` },
            ...historial,
            { role: 'user', content: mensaje }
          ],
          stream: true
        })
      });
      return new Response(response.body, { headers: { 'Content-Type': 'text/event-stream' } });
    }

    // 3. LÓGICA DE REDACCIÓN (GEMINI)
    if (action === 'redactar') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Basado en: ${textoBase}. Genera 4 versiones de esta nota.` }] }]
        })
      });
      return new Response(response.body, { headers: { 'Content-Type': 'text/event-stream' } });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}