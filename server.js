require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const pdfParse = require('pdf-parse');
const Groq    = require('groq-sdk');

// ──────────────────────────────────────────────
// Configuración
// ──────────────────────────────────────────────
const PORT      = process.env.PORT || 8000;
const DOCS_DIR  = path.join(__dirname, 'docs');
const GROQ_KEY  = process.env.GROQ_API_KEY;

if (!GROQ_KEY) {
  console.error('❌  GROQ_API_KEY no está definida. Agrega la variable a .env.local o al entorno.');
  process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_KEY });
const app  = express();

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// Extracción de texto de PDFs al iniciar
// ──────────────────────────────────────────────
let docsContext = '';

async function cargarDocumentos() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.warn(`⚠️  Carpeta "docs" no encontrada en ${DOCS_DIR}. El asistente usará solo conocimiento general.`);
    return;
  }

  const archivos = fs.readdirSync(DOCS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (archivos.length === 0) {
    console.warn('⚠️  No se encontraron archivos PDF en la carpeta docs/.');
    return;
  }

  console.log(`📄  Procesando ${archivos.length} PDF(s)...`);

  for (const archivo of archivos) {
    try {
      const buffer = fs.readFileSync(path.join(DOCS_DIR, archivo));
      const data   = await pdfParse(buffer);
      docsContext += `\n\n=== ${archivo} ===\n${data.text}`;
      console.log(`  ✅  ${archivo} (${data.numpages} páginas)`);
    } catch (err) {
      console.error(`  ❌  Error procesando ${archivo}:`, err.message);
    }
  }

  console.log('📚  Documentos cargados correctamente.\n');
}

// ──────────────────────────────────────────────
// Endpoint POST /chat
// ──────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  const mensaje = (req.body.message || req.body.mensaje || '').trim();

  if (!mensaje) {
    return res.status(400).json({ error: 'El campo "message" es obligatorio.' });
  }

  const systemPrompt = `Eres el Asistente Virtual Oficial del ITEC.
Tu objetivo es responder consultas institucionales basándote en la siguiente información oficial:
---
${docsContext || 'No se cargaron documentos institucionales.'}
---
REGLAS:
1. Responde con prioridad absoluta usando la información provista en los documentos.
2. Si la respuesta no figura en los documentos, recurre a tu conocimiento general pero aclarando obligatoriamente: "Esta información no figura en la documentación oficial del ITEC, pero..."
3. Sé breve, preciso, amable y responde siempre en español.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: mensaje }
      ],
      temperature: 0.4,
      max_tokens:  1024,
    });

    const respuesta = completion.choices[0]?.message?.content || 'Sin respuesta.';
    res.json({ response: respuesta });

  } catch (err) {
    console.error('Error en Groq API:', err.message);
    res.status(500).json({
      error: 'Error al procesar la solicitud con el modelo de IA.',
      detail: err.message
    });
  }
});

// ──────────────────────────────────────────────
// Inicio del servidor
// ──────────────────────────────────────────────
cargarDocumentos().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  Servidor ITEC corriendo en http://localhost:${PORT}`);
    console.log(`   Endpoint disponible: POST http://localhost:${PORT}/chat\n`);
  });
});
