import type { Metadata } from 'next'
import Image from 'next/image'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-gray-950 to-gray-950 pointer-events-none" />

      <div className="relative z-10 bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center shadow-2xl">
        {/* Logo real */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logoitectrans_v2.png"
            alt="ITEC Saladillo"
            width={220}
            height={82}
            className="h-20 w-auto object-contain"
            priority
          />
        </div>

        <p className="text-gray-400 mb-8 text-sm">
          Acceso exclusivo para miembros de la organización
        </p>

        {/* Error de auth */}
        {params.error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            Error de autenticación. Por favor intentá de nuevo.
          </div>
        )}

        {/* Botón Google conectado */}
        <GoogleSignInButton />

        <p className="mt-6 text-xs text-gray-600">
          Al continuar aceptás los términos de uso de ITEC.
        </p>
      </div>
    </div>
  )
}
