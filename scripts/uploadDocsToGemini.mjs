import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'geminiFiles.json');

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY no está configurada. Usa: node --env-file=.env scripts/uploadDocsToGemini.mjs");
  process.exit(1);
}

const fileManager = new GoogleAIFileManager(API_KEY);

async function uploadFile(filePath, displayName) {
  console.log(`Subiendo ${displayName}...`);
  const uploadResponse = await fileManager.uploadFile(filePath, {
    mimeType: "application/pdf",
    displayName: displayName,
  });

  const name = uploadResponse.file.name;
  console.log(`Subido exitosamente con ID: ${name}`);

  let file = await fileManager.getFile(name);
  while (file.state === "PROCESSING") {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fileManager.getFile(name);
  }
  console.log();

  if (file.state === "FAILED") {
    throw new Error(`El procesamiento falló.`);
  }

  console.log(`¡Archivo listo! URI: ${file.uri}`);
  return {
    name: file.name,
    uri: file.uri,
    mimeType: file.mimeType
  };
}

async function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.log(`El directorio docs no existe: ${DOCS_DIR}`);
    return;
  }

  const files = fs.readdirSync(DOCS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log("No se encontraron archivos PDF.");
    return;
  }

  const uploadedFiles = [];

  for (const fileName of files) {
    const filePath = path.join(DOCS_DIR, fileName);
    try {
      const fileData = await uploadFile(filePath, fileName);
      uploadedFiles.push(fileData);
    } catch (error) {
      console.error(`Error subiendo ${fileName}:`, error);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ files: uploadedFiles }, null, 2));
  console.log(`\n¡Éxito! Se guardaron ${uploadedFiles.length} archivos en src/lib/geminiFiles.json`);
}

main().catch(console.error);
