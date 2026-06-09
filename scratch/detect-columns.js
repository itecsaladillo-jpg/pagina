const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function run() {
  const email = `temp_${Math.floor(Math.random() * 1000000)}@itectest.com`;
  const password = 'TemporaryPassword123!';

  console.log(`Registering temporary user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  console.log('Successfully registered! Logging in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  const jwt = signInData.session.access_token;
  console.log('Login successful! Fetching members table schema (PostgREST metadata/OPTIONS) with auth token...');

  // Intentamos hacer un OPTIONS a /rest/v1/members con el token JWT
  const https = require('https');
  const url = `${supabaseUrl}/rest/v1/members`;
  
  const req = https.request(url, {
    method: 'OPTIONS',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${jwt}`
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('OPTIONS Response Status:', res.statusCode);
      try {
        const info = JSON.parse(data);
        console.log('OPTIONS Body keys:', Object.keys(info || {}));
        if (info && info.definitions && info.definitions.members) {
          console.log('Members Table Properties via OPTIONS:');
          console.log(JSON.stringify(info.definitions.members.properties, null, 2));
        } else {
          console.log('OPTIONS raw data:', data);
        }
      } catch (e) {
        console.log('Raw data received (could not parse JSON):', data);
      }
      
      // Ahora intentamos hacer un SELECT de members para ver si devuelve registros
      fetchMembers(jwt);
    });
  });

  req.on('error', (err) => {
    console.error('OPTIONS request error:', err);
  });

  req.end();
}

async function fetchMembers(jwt) {
  console.log('\nFetching members records using supabase-js with authentication...');
  
  // Creamos un nuevo cliente pasándole el JWT en las cabeceras globales o usando setSession
  const authenticatedClient = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    },
    auth: {
      persistSession: false
    }
  });

  const { data, error } = await authenticatedClient
    .from('members')
    .select('*')
    .limit(3);

  if (error) {
    console.error('Error fetching members:', error);
  } else {
    console.log(`Fetched ${data ? data.length : 0} records.`);
    if (data && data.length > 0) {
      console.log('Columns found in record:');
      console.log(Object.keys(data[0]));
      console.log('First record sample:', data[0]);
    } else {
      console.log('No records found or returned empty array.');
    }
  }

  // Limpieza: intentar borrar el usuario no es estrictamente necesario ya que es una base de datos de test/desarrollo y la cuenta quedará inactiva/pendiente, pero al menos cerramos sesión.
  await supabase.auth.signOut();
}

run();
