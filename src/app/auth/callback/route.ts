import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  // Supabase puede devolver un error directamente en la query string
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('[auth/callback] Supabase OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&desc=${encodeURIComponent(errorDescription ?? '')}`
    )
  }

  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[auth/callback] exchangeCodeForSession error:', exchangeError.message)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Verificar si el usuario tiene acceso activo
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=no_user`)
    }

    const { data: member } = await supabase
      .from('members')
      .select('status')
      .eq('id', user.id)
      .single()

    if (!member || member.status === 'pendiente') {
      // Usuario autenticado pero no autorizado → cerrar sesión y volver a la home con mensaje
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/?acceso=no-autorizado`)
    }

    // Usuario activo → redirigir al dashboard
    return NextResponse.redirect(`${origin}/dashboard/miembros`)
  }

  // Sin code ni error — algo raro pasó
  return NextResponse.redirect(`${origin}/login?error=missing_code`)
}
