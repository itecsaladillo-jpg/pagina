const https = require('https');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const columnsToTest = [
  // Frase
  'phrase', 'personal_phrase', 'itec_phrase', 'phrase_itec', 'quote', 'itec_quote', 'frase', 'frase_personal', 'frase_itec', 'bio',
  // Tareas
  'tasks', 'itec_tasks', 'roles', 'responsibilities', 'activities', 'tareas', 'tareas_itec',
  // Habilidades
  'skills', 'abilities', 'knowledge', 'skills_knowledge', 'habilidades', 'conocimientos', 'habilidades_conocimientos'
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
          if (errMsg.includes('does not exist') || errMsg.includes('no existe')) {
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
  console.log('Testing column existence detailed...');
  for (const col of columnsToTest) {
    const res = await testColumn(col);
    if (res.status === 200 || !res.isNotExist) {
      console.log(`✅ Column [${res.column}] EXISTS (Status: ${res.status}, Msg: ${res.error.replace(/\n/g, ' ')})`);
    } else {
      console.log(`❌ Column [${res.column}] DOES NOT EXIST (Status: ${res.status}, Msg: ${res.error.replace(/\n/g, ' ')})`);
    }
  }
}

run();
