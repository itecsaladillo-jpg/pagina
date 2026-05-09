import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * proxy.ts — Funciona como middleware en este setup de Next.js.
 * 
 * Rutas protegidas:   /dashboard (requiere sesión activa + miembro activo)
 * Rutas de auth:      /login, /register (redirige al dashboard si ya está logueado)
 */

const PROTECTED_ROUTES = ['/dashboard']
const AUTH_ONLY_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
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

  // Refrescar sesión — no agregar lógica entre createServerClient y getUser
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ─── Rutas protegidas: redirige al login si no está autenticado ───
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ─── Verificar rol de miembro activo para el dashboard ───
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
  }

  // ─── Rutas de auth: redirige al dashboard si ya está logueado ───
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
