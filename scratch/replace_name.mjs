import fs from 'fs';
import path from 'path';

const files = [
  'src/types/database.ts',
  'src/services/sponsorReport.ts',
  'src/lib/email.ts',
  'src/components/reuniones/MeetingLobby.tsx',
  'src/components/landing/Navbar.tsx',
  'src/components/landing/HeroSection.tsx',
  'src/components/landing/Footer.tsx',
  'src/components/landing/AboutSection.tsx',
  'src/app/sponsors/[id]/page.tsx',
  'src/app/login/page.tsx',
  'src/app/layout.tsx',
  'src/app/globals.css',
  'src/app/dashboard/layout.tsx',
  'src/app/articulo/[slug]/page.tsx',
  'src/app/acceso-pendiente/page.tsx',
  'src/services/ai.ts'
];

files.forEach(f => {
  const fullPath = path.resolve('e:/ITEC/itec-cicre', f);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/ITEC\s+["']?Augusto Cicaré["']?/gi, 'ITEC Saladillo');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${f}`);
  } else {
    console.warn(`File not found: ${f}`);
  }
});
