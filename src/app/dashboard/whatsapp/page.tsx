import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { WhatsAppManagementClient } from './WhatsAppManagementClient'

export default async function WhatsAppPage() {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') redirect('/dashboard')

  return <WhatsAppManagementClient />
}
