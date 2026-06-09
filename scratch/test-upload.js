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
  const email = `temp_uploader_${Math.floor(Math.random() * 1000000)}@itectest.com`;
  const password = 'TemporaryPassword123!';

  console.log(`Registering temporary user for upload test: ${email}...`);
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

  const user = signInData.user;
  console.log(`Login successful! User ID: ${user.id}.`);
  console.log('Inserting a temporary member record so the RLS policies can find us...');

  // The policy requires the user to exist in public.members:
  // "exists (select 1 from public.members where id = auth.uid())"
  // Let's create a temporary member record for this user.
  const { error: memberError } = await supabase
    .from('members')
    .insert({
      id: user.id,
      full_name: 'Test Uploader',
      email: email,
      role: 'colaborador'
    });

  if (memberError) {
    console.error('Error inserting member record:', memberError);
    await supabase.auth.signOut();
    return;
  }

  console.log('Member record inserted successfully! Attempting file upload to "avatars" bucket...');

  const fileContent = 'test-image-content-simulation';
  const fileName = `test-${user.id}-${Date.now()}.txt`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, Buffer.from(fileContent), {
      contentType: 'text/plain',
      upsert: true
    });

  if (uploadError) {
    console.error('Upload failed:', uploadError);
  } else {
    console.log('Upload successful! Upload data:', uploadData);
    
    // Test get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    console.log('Public URL is:', publicUrl);
  }

  // Clean up: delete member record
  console.log('Cleaning up temporary member record...');
  await supabase.from('members').delete().eq('id', user.id);
  await supabase.auth.signOut();
  console.log('Test completed.');
}

run();
