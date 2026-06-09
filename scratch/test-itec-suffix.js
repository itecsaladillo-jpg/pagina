const https = require('https');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const columnsToTest = [
  'conocimiento_itec',
  'habilidad_itec',
  'habilidades_conocimientos_itec',
  'conocimientos_habilidades_itec',
  'skills_knowledge_itec',
  'aptitud_itec',
  'competencia_itec',
  'habilidades_y_conocimientos_itec',
  'conocimientos_y_habilidades_itec',
  'skills_y_conocimientos_itec',
  'conocimientos_y_skills_itec',
  'habilidades_skills_itec',
  'skills_habilidades_itec'
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
  console.log('Testing column names with _itec suffix...');
  for (const col of columnsToTest) {
    const res = await testColumn(col);
    if (res.status === 200 || !res.isNotExist) {
      console.log(`✅ Column [${res.column}] EXISTS (Status: ${res.status}, Msg: ${res.error.replace(/\n/g, ' ')})`);
    }
  }
  console.log('Done testing.');
}

run();
