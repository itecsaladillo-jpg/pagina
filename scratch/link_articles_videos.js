/**
 * Aplica la migración 022 en Supabase mediante la REST API (service role no disponible).
 * Usa la anon key para leer y comprueba si la columna ya existe.
 * Luego vincula los artículos conocidos con sus videos usando PATCH a la API REST.
 *
 * NOTA: Este script requiere SUPABASE_SERVICE_ROLE_KEY en .env.local para poder
 * ejecutar DDL y updates privilegiados. Si no está disponible, imprime las instrucciones.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Opcional pero requerido para DDL

// ─── Mapeo artículo <-> video (determinado por análisis semántico) ───
const RELACIONADOS = [
  {
    articleTitle: 'Soldando el futuro industrial de Saladillo',
    articleId: 'e323c22f-f240-45c8-b819-b9cb1b01f5ef',
    videoId: 'e0bf7154-837e-4ad4-a9d7-a1f996f9d935', // CURSO DE SOLDADURA
    videoTitle: 'CURSO DE SOLDADURA',
  },
  {
    articleTitle: 'Vanguardia y Arraigo: La Transformación Digital de la Ganadería Local',
    articleId: 'd386b673-1d49-4dee-a764-238b59c74a1f',
    videoId: '07eae729-4152-44bd-a80b-3dca38078b64', // GANADERIA DE PRESICION...
    videoTitle: 'GANADERIA DE PRESICION PARA INCREMENTAR LA PRODUCTIVIDAD',
  },
  {
    articleTitle: 'Saladillo impulsa el futuro industrial',
    articleId: 'f1c774a1-c41a-49b7-9a94-a758fc0fa595',
    videoId: '2e3376f9-3c68-4356-9d43-8c640b026681', // CAPACITACION EN AUTOMATIZACION NEUMATICA
    videoTitle: 'CAPACITACION EN AUTOMATIZACION NEUMATICA',
  },
];

async function run() {
  const supabase = createClient(supabaseUrl, serviceKey || anonKey);

  console.log(`\n=== VINCULACIÓN ARTÍCULOS <-> VIDEOS EN SUPABASE ===`);
  console.log(`Usando ${serviceKey ? 'service role key (privilegiado)' : 'anon key (limitado)'}\n`);

  for (const rel of RELACIONADOS) {
    console.log(`Procesando: "${rel.articleTitle}"`);
    console.log(`  → Video: "${rel.videoTitle}"`);

    const { data, error } = await supabase
      .from('public_articles')
      .update({ related_video_id: rel.videoId })
      .eq('id', rel.articleId)
      .select('id, title, related_video_id');

    if (error) {
      console.error(`  ✗ Error:`, error.message, error.code);
      if (error.code === 'PGRST204') {
        console.error(`  ✗ La columna related_video_id NO existe aún en la tabla.`);
        console.error(`    Debés aplicar la migración 022_article_related_video.sql en Supabase Dashboard.`);
      }
    } else if (data && data.length > 0) {
      console.log(`  ✓ Artículo actualizado. related_video_id = ${data[0].related_video_id}`);
    } else {
      console.log(`  ⚠ No se encontró el artículo con ese ID o sin permisos de escritura.`);
    }
  }

  console.log('\n=== VERIFICACIÓN FINAL ===');
  const { data: articles, error: e } = await supabase
    .from('public_articles')
    .select('id, title, related_video_id')
    .eq('is_published', true);

  if (e) {
    console.error('Error consultando artículos:', e.message);
  } else {
    articles.forEach(a => {
      console.log(`${a.related_video_id ? '✓' : '○'} "${a.title}" → video: ${a.related_video_id || 'sin vincular'}`);
    });
  }
}

run();
