import type { Metadata } from 'next'
import { LoginClientContent } from '@/components/auth/LoginClientContent'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Iniciar sesión — ITEC Saladillo',
}

/**
 * Página /login — Solo se muestra cuando hay un error en el proceso OAuth.
 * El inicio de sesión se dispara directamente desde el botón en el Navbar.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; desc?: string; logout?: string }>
}) {
  const params = await searchParams

  // Si ya está autenticado y tiene perfil, va al dashboard
  const member = await getCurrentMember()
  if (member) {
    redirect('/dashboard')
  }

  return <LoginClientContent error={params.error} errorDesc={params.desc} />
}
