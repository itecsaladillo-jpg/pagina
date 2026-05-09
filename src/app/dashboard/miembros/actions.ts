'use server'

import { approveMember, updateMemberRole, assignToCommission } from '@/services/admin'
import { getCurrentMember } from '@/services/auth'
import { sendApprovalEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function approveMemberAction(memberId: string) {
  const admin = await getCurrentMember()
  if (admin?.role !== 'admin') throw new Error('No autorizado')
  
  const res = await approveMember(memberId)
  if (res.success && res.data) {
    // Intentar enviar email (no bloquea la respuesta)
    sendApprovalEmail(res.data.email, res.data.full_name).catch(console.error)
    revalidatePath('/dashboard/miembros')
  }
  return res
}

export async function updateRoleAction(memberId: string, role: any) {
  const admin = await getCurrentMember()
  if (admin?.role !== 'admin') throw new Error('No autorizado')
  
  const res = await updateMemberRole(memberId, role)
  if (res.success) revalidatePath('/dashboard/miembros')
  return res
}

export async function assignCommissionAction(memberId: string, commissionId: string, isCoordinator: boolean) {
  const admin = await getCurrentMember()
  if (admin?.role !== 'admin') throw new Error('No autorizado')
  
  const res = await assignToCommission(memberId, commissionId, isCoordinator)
  if (res.success) revalidatePath('/dashboard/miembros')
  return res
}
