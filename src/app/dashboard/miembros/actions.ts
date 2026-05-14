'use server'

import { approveMember, approveMemberByEmail, updateMemberRole, updatePreApprovedRole, assignToCommission, deactivateMember } from '@/services/admin'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function approveMemberByEmailAction(email: string) {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No tenés permisos de administrador.' }
    }
    
    const res = await approveMemberByEmail(email)
    if (res.success) revalidatePath('/dashboard/miembros')
    return { success: res.success, message: (res as any).message, error: res.error }
  } catch (err: any) {
    console.error('[approveMemberByEmailAction] Error:', err)
    return { success: false, error: 'Error al procesar la aprobación.' }
  }
}

export async function approveMemberAction(memberId: string) {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No tenés permisos de administrador.' }
    }
    
    const res = await approveMember(memberId)
    if (res.success) revalidatePath('/dashboard/miembros')
    return res
  } catch (err: any) {
    console.error('[approveMemberAction] Error:', err)
    return { success: false, error: 'Error al procesar la aprobación.' }
  }
}

export async function deactivateMemberAction(memberId: string) {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') return { success: false, error: 'No autorizado' }
    
    const res = await deactivateMember(memberId)
    if (res.success) revalidatePath('/dashboard/miembros')
    return res
  } catch (err) {
    return { success: false, error: 'Error al deshabilitar miembro.' }
  }
}

export async function updateRoleAction(idOrEmail: string, role: any) {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') return { success: false, error: 'No autorizado' }
    
    // Si contiene un @, es una pre-aprobación en la tabla allowed_emails
    if (idOrEmail.includes('@')) {
      const res = await updatePreApprovedRole(idOrEmail, role)
      if (res.success) revalidatePath('/dashboard/miembros')
      return res
    }

    const res = await updateMemberRole(idOrEmail, role)
    if (res.success) revalidatePath('/dashboard/miembros')
    return res
  } catch (err) {
    return { success: false, error: 'Error al cambiar el rol.' }
  }
}

export async function assignCommissionAction(memberId: string, commissionId: string, isCoordinator: boolean) {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') return { success: false, error: 'No autorizado' }
    
    const res = await assignToCommission(memberId, commissionId, isCoordinator)
    if (res.success) revalidatePath('/dashboard/miembros')
    return res
  } catch (err) {
    return { success: false, error: 'Error al asignar comisión.' }
  }
}
