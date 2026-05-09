'use server'

import { approveMember, updateMemberRole, assignToCommission, deactivateMember } from '@/services/admin'
import { getCurrentMember } from '@/services/auth'
import { sendApprovalEmail, sendReactivationEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function approveMemberAction(memberId: string, sendEmail: boolean = true) {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No tenés permisos de administrador.' }
    }
    
    // 1. Aprobar en la base de datos
    const res = await approveMember(memberId)
    
    if (res.success && res.data) {
      let emailSent = false
      let emailError = null

      // 2. Intentar enviar email
      if (process.env.RESEND_API_KEY) {
        try {
          const emailRes = sendEmail 
            ? await sendApprovalEmail(res.data.email, res.data.full_name)
            : await sendReactivationEmail(res.data.email, res.data.full_name)
          
          emailSent = !!emailRes?.success
          if (emailRes && !emailRes.success) emailError = emailRes.error
        } catch (err: any) {
          console.error('[Action] Error crítico en sendApprovalEmail:', err)
          emailError = err.message
        }
      } else {
        emailError = 'API Key de Resend no configurada.'
      }

      revalidatePath('/dashboard/miembros')
      return { 
        success: true, 
        data: res.data,
        emailStatus: emailSent ? 'sent' : 'failed',
        emailError
      }
    }
    
    return res
  } catch (err: any) {
    console.error('[approveMemberAction] Error fatal:', err)
    return { success: false, error: 'Error interno del servidor al procesar la aprobación.' }
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

export async function updateRoleAction(memberId: string, role: any) {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') return { success: false, error: 'No autorizado' }
    
    const res = await updateMemberRole(memberId, role)
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
