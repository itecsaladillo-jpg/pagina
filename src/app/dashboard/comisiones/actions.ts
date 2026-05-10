'use server'

import { createCommission, updateCommission } from '@/services/admin'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function createCommissionAction(formData: FormData) {
  const admin = await getCurrentMember()
  if (admin?.role !== 'admin') throw new Error('No autorizado')

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const icon = formData.get('icon') as string
  const color = formData.get('color') as string
  const meet_link = formData.get('meet_link') as string

  const res = await createCommission({
    name,
    slug,
    description,
    icon,
    color,
    meet_link: meet_link || null,
    is_active: true,
    coordinator_id: null
  })

  if (res.success) revalidatePath('/dashboard/comisiones')
  return res
}

export async function updateMeetLinkAction(commissionId: string, meetLink: string) {
  const admin = await getCurrentMember()
  if (admin?.role !== 'admin') throw new Error('No autorizado')

  const res = await updateCommission(commissionId, { meet_link: meetLink || null })
  if (res.success) revalidatePath('/dashboard/comisiones')
  return res
}

export async function toggleCommissionStatusAction(id: string, isActive: boolean) {
  const admin = await getCurrentMember()
  if (admin?.role !== 'admin') throw new Error('No autorizado')

  const res = await updateCommission(id, { is_active: isActive })
  if (res.success) revalidatePath('/dashboard/comisiones')
  return res
}
