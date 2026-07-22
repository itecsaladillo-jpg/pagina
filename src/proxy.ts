import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * proxy.ts — Reemplaza al tradicional middleware.ts en Next.js 16.
 */

const PROTECTED_ROUTES = ['/dashboard']
const AUTH_ONLY_ROUTES = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ──────────────────────────────────────────────────────────────
  // INTERCEPTOR DE OAUTH CODE
  // Si Supabase redirige a cualquier URL con ?code= (por tener el
  // Site URL mal configurado), lo capturamos aquí y lo enviamos
  // al handler correcto /auth/callback antes de cualquier otra lógica.
  // ──────────────────────────────────────────────────────────────
  const code = searchParams.get('code')
  if (code && pathname !== '/auth/callback') {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    callbackUrl.search = ''
    callbackUrl.searchParams.set('code', code)
    const state = searchParams.get('state')
    if (state) callbackUrl.searchParams.set('state', state)
    return NextResponse.redirect(callbackUrl)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión
  const { data: { user } } = await supabase.auth.getUser()

  // Rutas protegidas
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar estado del miembro
  if (isProtectedRoute && user) {
    const { data: member } = await supabase
      .from('members')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (!member || member.status !== 'activo') {
      const pendingUrl = request.nextUrl.clone()
      pendingUrl.pathname = '/acceso-pendiente'
      return NextResponse.redirect(pendingUrl)
    }

    // Redirigir a los miembros activos directamente a la sección de miembros
    if (pathname === '/dashboard' && member.status === 'activo') {
      const miembrosUrl = request.nextUrl.clone()
      miembrosUrl.pathname = '/dashboard/miembros'
      return NextResponse.redirect(miembrosUrl)
    }
  }

  // Rutas de auth — si ya está logueado, no mostrar login
  const isAuthRoute = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/chat|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
