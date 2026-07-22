export const runtime = 'edge';

import { GoogleGenerativeAI } from '@google/generative-ai';
import geminiFiles from '@/lib/geminiFiles.json';

export async function POST(request: Request) {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const mensaje = cuerpo.message || cuerpo.mensaje;

  if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
    return new Response(JSON.stringify({ error: 'Mensaje requerido' }), { status: 400 });
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('GEMINI_API_KEY no configurada');
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY no configurada en Vercel' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    const SYSTEM_PROMPT = `Eres el Asistente Virtual Oficial del ITEC. Responde con máxima prioridad basándote en los documentos adjuntos. Si la respuesta no está en los documentos, recurre al conocimiento general/búsqueda web pero aclara obligatoriamente: "Esta información no figura en la documentación oficial del ITEC, pero...". Sé breve, profesional y responde en español.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT
    });

    const contents: any[] = [];
    
    // Agregamos los archivos pre-subidos al request
    if (geminiFiles && geminiFiles.files && geminiFiles.files.length > 0) {
      geminiFiles.files.forEach((file: any) => {
        contents.push({
          fileData: {
            mimeType: file.mimeType || "application/pdf",
            fileUri: file.uri
          }
        });
      });
    }

    // Agregamos el mensaje del usuario
    contents.push({ text: mensaje });

    // Llamamos a la API
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: contents }]
    });

    const text = result.response.text();

    return new Response(JSON.stringify({ response: text }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('Error con Gemini API:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor al procesar la solicitud con Gemini',
      detail: error.message || error.toString()
    }), { status: 500 });
  }
}