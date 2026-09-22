const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'docsContext.json');

async function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.warn(`Carpeta "docs" no encontrada en ${DOCS_DIR}`);
    return;
  }

  const archivos = fs.readdirSync(DOCS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (archivos.length === 0) {
    console.warn('No se encontraron archivos PDF.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ text: "" }, null, 2));
    return;
  }

  let textAcc = "";
  for (const archivo of archivos) {
    try {
      const buffer = fs.readFileSync(path.join(DOCS_DIR, archivo));
      const data = await pdfParse(buffer);
      textAcc += `\n\n=== ${archivo} ===\n${data.text}`;
      console.log(`✅ Extraído: ${archivo}`);
    } catch (err) {
      console.error(`❌ Error con ${archivo}:`, err.message);
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ text: textAcc.trim() }, null, 2));
  console.log(`\n📚 ¡Textos guardados en ${OUTPUT_FILE}!`);
}

main().catch(console.error);
