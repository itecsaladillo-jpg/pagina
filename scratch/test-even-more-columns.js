const https = require('https');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const columnsToTest = [
  'aptitudes', 'aptitudes_itec', 'aptitudes_miembro', 'aptitudes_equipo',
  'competencias_equipo', 'competencias_miembro', 'competencias_miembros',
  'conocimientos_y_habilidades', 'habilidades_y_conocimientos',
  'conocimientos_habilidades', 'habilidades_conocimientos',
  'habilidades_para_equipo', 'habilidades_para_el_equipo',
  'skills_para_equipo', 'habilidades_miembros', 'conocimientos_miembros',
  'skills_miembros', 'skills_miembro', 'skills_members',
  'habilidades_skills', 'skills_habilidades',
  'habilidades_miembro_itec', 'habilidades_miembros_itec',
  'conocimientos_miembro_itec', 'conocimientos_miembros_itec',
  'habilidades_disponibles_equipo',
  'knowledge_skills', 'skills_knowledge',
  'frase', 'tareas', 'habilidades',
  'habilidades_conocimientos_miembro',
  'skills_knowledge_member',
  'habilidades_y_conocimientos_miembro',
  'skills_y_conocimientos',
  'conocimientos_y_skills'
];

async function testColumn(columnName) {
  return new Promise((resolve) => {
    const url = `${supabaseUrl}/rest/v1/members?id=eq.00000000-0000-0000-0000-000000000000`;
    const payload = JSON.stringify({ [columnName]: 'test_val' });
    
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let isNotExist = false;
        let errMsg = '';
        try {
          const err = JSON.parse(data);
          errMsg = err.message || '';
          if (errMsg.includes('Could not find') || errMsg.includes('does not exist') || errMsg.includes('no existe')) {
            isNotExist = true;
          }
        } catch (e) {
          errMsg = data;
        }
        resolve({ column: columnName, status: res.statusCode, error: errMsg, isNotExist });
      });
    });

    req.on('error', (err) => {
      resolve({ column: columnName, status: 0, error: err.message, isNotExist: true });
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing even more skill column names...');
  for (const col of columnsToTest) {
    const res = await testColumn(col);
    if (res.status === 200 || !res.isNotExist) {
      console.log(`✅ Column [${res.column}] EXISTS (Status: ${res.status}, Msg: ${res.error.replace(/\n/g, ' ')})`);
    }
  }
  console.log('Done testing.');
}

run();
