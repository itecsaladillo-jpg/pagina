import type { Metadata } from 'next'
import { LoginClientContent } from '@/components/auth/LoginClientContent'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/services/auth'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; logout?: string }>
}) {
  const params = await searchParams

  // 1. Si ya está autenticado, va al dashboard de una
  const member = await getCurrentMember()
  if (member) {
    redirect('/dashboard')
  }

  // 2. Si no es un flujo de logout explícito, redirección automática a Google
  if (params.logout !== 'true') {
    const supabase = await createClient()
    const headersList = await headers()
    const host = headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const origin = `${proto}://${host}`

    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (data?.url) {
      redirect(data.url)
    }
  }

  return <LoginClientContent error={params.error} />
}
