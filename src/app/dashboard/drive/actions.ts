'use server'

import { listFolderFiles } from '@/services/drive'
import { getCurrentMember } from '@/services/auth'

export async function getFolderFilesAction(folderId: string) {
  try {
    const member = await getCurrentMember()
    if (!member || member.status !== 'activo') {
      return { success: false, error: 'No autorizado' }
    }

    const files = await listFolderFiles(folderId)
    return { success: true, files }
  } catch (err) {
    return { success: false, error: 'Error al obtener los archivos de Google Drive.' }
  }
}
