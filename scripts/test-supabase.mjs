import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ooqosswidezaexqyebqa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const TABLES = ['members', 'commissions', 'commission_members', 'trainings', 'training_enrollments', 'ideas']

console.log('\n🔌 Verificando conexión con Supabase...')
console.log(`   URL: ${SUPABASE_URL}\n`)

let allOk = true

for (const table of TABLES) {
  const { error, status } = await supabase.from(table).select('*').limit(0)

  if (error && error.code === '42P01') {
    console.log(`  ❌  ${table.padEnd(28)} → TABLA NO EXISTE (ejecutá el SQL)`)
    allOk = false
  } else if (error && status !== 401 && status !== 406) {
    console.log(`  ❌  ${table.padEnd(28)} → ERROR ${status}: ${error.message}`)
    allOk = false
  } else {
    const rls = status === 401 ? ' (RLS activo ✔)' : ''
    console.log(`  ✅  ${table.padEnd(28)} → OK${rls}`)
  }
}

// Test RPC
const { error: rpcError } = await supabase.rpc('increment_upvotes', { idea_id: '00000000-0000-0000-0000-000000000000' })
if (rpcError && rpcError.code === '42883') {
  console.log(`  ❌  ${'RPC increment_upvotes'.padEnd(28)} → FUNCIÓN NO EXISTE (ejecutá el SQL)`)
  allOk = false
} else {
  console.log(`  ✅  ${'RPC increment_upvotes'.padEnd(28)} → OK`)
}

console.log('\n' + (allOk
  ? '🟢 Conexión verificada — Supabase listo para usar.'
  : '🔴 Hay errores — revisá si ejecutaste el SQL en el editor de Supabase.'))
console.log()
