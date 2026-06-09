const https = require('https');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const columnsToTest = [
  'habilidades_conocimientos_miembro_itec',
  'conocimientos_habilidades_miembro_itec',
  'skills_knowledge_member_itec',
  'habilidades_y_conocimientos_miembro_itec',
  'conocimientos_y_habilidades_miembro_itec',
  'skills_y_conocimientos_miembro_itec',
  'conocimientos_y_skills_miembro_itec',
  'conocimientos_habilidades_equipo',
  'habilidades_conocimientos_equipo',
  'conocimientos_y_habilidades_equipo',
  'skills_tecnicos',
  'habilidades_profesionales',
  'skills_profesionales',
  'conocimientos_profesionales',
  'habilidades_equipo_itec',
  'conocimientos_equipo_itec',
  'skills_equipo_itec',
  'habilidades_colaborador',
  'conocimientos_colaborador',
  'skills_colaborador',
  'habilidades_colaborador_itec',
  'conocimientos_colaborador_itec',
  'skills_colaborador_itec',
  'habilidades_conocimientos_colaborador',
  'conocimientos_habilidades_colaborador'
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
  console.log('Testing final variations...');
  for (const col of columnsToTest) {
    const res = await testColumn(col);
    if (res.status === 200 || !res.isNotExist) {
      console.log(`✅ Column [${res.column}] EXISTS (Status: ${res.status}, Msg: ${res.error.replace(/\n/g, ' ')})`);
    }
  }
  console.log('Done testing.');
}

run();
