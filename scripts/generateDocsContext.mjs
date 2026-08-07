import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse-new';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'docsContext.ts');

async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdfParse(dataBuffer);
    return cleanExtractedText(data.text || '');
  } catch (error) {
    console.error(`Error parsing PDF ${filePath}:`, error);
    return '';
  }
}

/**
 * Limpia texto extraído de PDFs para mejorar el keyword matching del RAG.
 * - Normaliza whitespace (múltiples espacios/saltos → uno solo)
 * - Elimina caracteres de control
 * - Corrige artefactos comunes de extracción PDF
 */
function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    // Eliminar caracteres de control (excepto tab, newline, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Colapsar múltiples espacios en uno solo
    .replace(/[ \t]+/g, ' ')
    // Colapsar múltiples líneas vacías en máximo 2
    .replace(/\n{3,}/g, '\n\n')
    // Eliminar espacios al final de líneas
    .replace(/[ \t]+$/gm, '')
    // Eliminar espacios al inicio de líneas (excepto listas)
    .replace(/^(?![•\-\*]) +/gm, '')
    // Unir palabras cortadas por salto de línea (patrón común en PDFs)
    .replace(/(\w)-\n(\w)/g, '$1$2')
    // Unir líneas que terminan en minúscula (párrafos partidos)
    .replace(/([a-záéíóúñ,;:])\n([a-záéíóúñ])/g, '$1 $2')
    .trim();
}

async function generateDocsContext() {
  console.log(`Buscando documentos en: ${DOCS_DIR}`);
  if (!fs.existsSync(DOCS_DIR)) {
    console.log('El directorio docs no existe.');
    return;
  }

  const files = fs.readdirSync(DOCS_DIR);
  let combinedContext = '';

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      let text = '';
      if (file.toLowerCase().endsWith('.pdf')) {
        console.log(`Procesando PDF: ${file}`);
        text = await extractTextFromPdf(filePath);
      } else if (file.toLowerCase().endsWith('.txt') || file.toLowerCase().endsWith('.md')) {
        console.log(`Procesando Texto: ${file}`);
        text = cleanExtractedText(fs.readFileSync(filePath, 'utf8'));
      }

      if (text.trim()) {
        combinedContext += `\n--- Inicio del documento: ${file} ---\n`;
        combinedContext += text.trim();
        combinedContext += `\n--- Fin del documento: ${file} ---\n\n`;
      }
    }
  }

  const fileContent = `// Archivo autogenerado. No editar manualmente.
// Ejecutar 'npm run sync-docs' para actualizar.

export const DOCS_CONTEXT = \`
Documentación Institucional de ITEC:
${combinedContext.replace(/`/g, '\\`')}
\`;
`;

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
  console.log(`Contexto guardado exitosamente en: ${OUTPUT_FILE}`);

  const JSON_OUTPUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'docsContext.json');
  fs.writeFileSync(JSON_OUTPUT_FILE, JSON.stringify({ text: combinedContext.trim() }, null, 2), 'utf8');
  console.log(`Contexto JSON guardado en: ${JSON_OUTPUT_FILE}`);
}

generateDocsContext().catch(console.error);
