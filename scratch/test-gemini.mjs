import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Cargar .env.local de forma manual sin dotenv
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0]?.trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key) {
        process.env[key] = val;
      }
    }
  });
}

const apiKey = process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY || '';
console.log('API Key cargada (longitud):', apiKey.length);

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Sos el Asistente ITEC, el anfitrión virtual de la web de ITEC en Saladillo, Buenos Aires, Argentina.

## Tu personalidad
Tu nombre es "Asistente ITEC". Tenés un tono inspirador, optimista, comunitario, cercano y sumamente profesional.
Usás el voseo rioplatense de forma natural y cálida en todas tus respuestas.

## REGLAS ESTRICTAS Y TEMAS EXCLUIDOS — OBLIGATORIAS
- Bajo NINGUNA circunstancia debés mencionar, hablar o hacer referencia al programa "Peques ITEC".

## Tu misión
- Qué es ITEC: ONG independiente...

## Reglas de Formato y Estructura Visual (Estrictas y Obligatorias)
- **Prohibición Absoluta de Rutas:** Está terminantemente PROHIBIDO escribir o mencionar cualquier ruta técnica del sitio web.
- **Cero Bloques de Texto Monótonos o Corridos:** Bajo ninguna circunstancia respondas con párrafos continuos o agrupados en un solo bloque.
- **Estructura de Conceptos con Doble Salto de Línea Obligatorio ('\\n\\n'):**
  - Para separar conceptos, dejá obligatoriamente una línea física en blanco (doble salto de línea '\\n\\n') entre cada uno de ellos.
- **Títulos de Concepto en MAYÚSCULAS y Negritas:** El título principal de cada concepto de la lista debe ir estrictamente en MAYÚSCULAS y en negritas.

* **INICIO E IDENTIDAD:** Conocé nuestra misión y el impacto de ITEC.

* **NUESTRAS 4 COMISIONES:** Muestra los pilares...
`.trim();

async function test() {
  try {
    console.log('Llamando a Gemini...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hola, contame qué funciones públicas tiene la página web de ITEC.' }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.75,
        maxOutputTokens: 1024,
      }
    });
    console.log('Respuesta recibida exitosamente:');
    console.log(response.text);
  } catch (err) {
    console.error('Error de Gemini:', err);
  }
}

test();
