import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const srcDir = path.resolve('e:/ITEC/itec-cicre/src');

walkDir(srcDir, (f) => {
  if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.css') || f.endsWith('.js') || f.endsWith('.mjs')) {
    let content = fs.readFileSync(f, 'utf8');
    // Reemplazar variaciones de ITEC Augusto Cicaré
    const newContent = content.replace(/ITEC\s+["']?Augusto Cicaré["']?/gi, 'ITEC Saladillo');
    if (content !== newContent) {
      fs.writeFileSync(f, newContent);
      console.log(`Updated: ${f}`);
    }
  }
});
