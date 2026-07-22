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
    return data.text;
  } catch (error) {
    console.error(`Error parsing PDF ${filePath}:`, error);
    return '';
  }
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
        text = fs.readFileSync(filePath, 'utf8');
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
}

generateDocsContext().catch(console.error);
