import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const member = await getCurrentMember()

  if (!member) redirect('/login')
  if (member.status !== 'activo') redirect('/acceso-pendiente')

  redirect('/dashboard/muro')

  return null
}