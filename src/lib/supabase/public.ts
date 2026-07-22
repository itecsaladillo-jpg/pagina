import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Este cliente NO usa cookies(). 
// Se utiliza exclusivamente para obtener datos públicos (RLS permite lectura anónima)
// al momento de hacer Static Site Generation (SSG) o ISR, para evitar optar
// la página entera a renderizado dinámico.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
