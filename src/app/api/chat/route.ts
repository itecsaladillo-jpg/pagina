import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import docsContext from '@/lib/docsContext.json';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const systemPrompt = `Eres el asistente virtual oficial de ITEC, experto en Augusto Cicaré.
Usa la siguiente información para responder preguntas de manera precisa y amigable.
Si no sabes la respuesta, indícalo de manera cortés y sugiere contactar a la institución.

--- INFORMACIÓN DE BASE ---
${docsContext.text}
---------------------------`;

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
