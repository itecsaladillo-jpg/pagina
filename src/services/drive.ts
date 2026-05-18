import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

/**
 * Obtiene el cliente de Google Drive autenticado.
 * Utiliza el JSON de la Cuenta de Servicio guardado en site_settings.
 */
async function getDriveClient() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('site_settings')
    .select('google_service_account_json')
    .single()

  if (!settings?.google_service_account_json) {
    throw new Error('No se ha configurado la Cuenta de Servicio de Google.')
  }

  try {
    const credentials = JSON.parse(settings.google_service_account_json)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })

    return google.drive({ version: 'v3', auth })
  } catch (err) {
    console.error('[DriveService] Error al parsear credenciales:', err)
    throw new Error('Las credenciales de Google no son válidas.')
  }
}

/**
 * Lista los archivos de una carpeta específica.
 */
export async function listFolderFiles(folderId: string) {
  try {
    const drive = await getDriveClient()
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, iconLink, modifiedTime, size)',
      orderBy: 'folder, name',
    })

    return res.data.files || []
  } catch (err: any) {
    console.error('[DriveService] Error al listar archivos:', err.message)
    return []
  }
}

/**
 * Busca archivos recientes en la unidad raíz configurada.
 */
export async function getRecentFiles(rootFolderId: string) {
  try {
    const drive = await getDriveClient()
    const res = await drive.files.list({
      q: `'${rootFolderId}' in parents and trashed = false`,
      pageSize: 5,
      fields: 'files(id, name, mimeType, webViewLink, iconLink, modifiedTime)',
      orderBy: 'modifiedTime desc',
    })

    return res.data.files || []
  } catch (err: any) {
    console.error('[DriveService] Error al obtener archivos recientes:', err.message)
    return []
  }
}
