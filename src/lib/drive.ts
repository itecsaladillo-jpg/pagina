/**
 * Configuración de carpetas de Google Drive por comisión del ITEC.
 * Reemplazar los IDs con los reales de tu Google Drive.
 */

export interface DriveFolder {
  commissionSlug: string
  commissionName: string
  folderId: string
  folderUrl: string
  description: string
}

/**
 * Mapa de comisiones → carpetas de Google Drive.
 * Para obtener el ID de una carpeta en Drive:
 * Abrir la carpeta → la URL tiene la forma: drive.google.com/drive/folders/ESTE_ES_EL_ID
 */
export const DRIVE_FOLDERS: DriveFolder[] = [
  {
    commissionSlug: 'comision-tecnologia',
    commissionName: 'Tecnología e Innovación',
    folderId: 'REEMPLAZAR_CON_ID_REAL',
    folderUrl: 'https://drive.google.com/drive/folders/REEMPLAZAR_CON_ID_REAL',
    description: 'Proyectos técnicos, código fuente y documentación de sistemas',
  },
  {
    commissionSlug: 'comision-educacion',
    commissionName: 'Educación y Capacitación',
    folderId: 'REEMPLAZAR_CON_ID_REAL',
    folderUrl: 'https://drive.google.com/drive/folders/REEMPLAZAR_CON_ID_REAL',
    description: 'Material de capacitaciones, presentaciones y recursos pedagógicos',
  },
  {
    commissionSlug: 'comision-comunicacion',
    commissionName: 'Comunicación',
    folderId: 'REEMPLAZAR_CON_ID_REAL',
    folderUrl: 'https://drive.google.com/drive/folders/REEMPLAZAR_CON_ID_REAL',
    description: 'Redes sociales, diseño gráfico y material de difusión',
  },
  {
    commissionSlug: 'comision-proyectos',
    commissionName: 'Gestión de Proyectos',
    folderId: 'REEMPLAZAR_CON_ID_REAL',
    folderUrl: 'https://drive.google.com/drive/folders/REEMPLAZAR_CON_ID_REAL',
    description: 'Planificación, cronogramas y seguimiento de proyectos',
  },
  {
    commissionSlug: 'general',
    commissionName: 'General ITEC',
    folderId: 'REEMPLAZAR_CON_ID_REAL',
    folderUrl: 'https://drive.google.com/drive/folders/REEMPLAZAR_CON_ID_REAL',
    description: 'Documentos institucionales, actas y archivo general',
  },
]

/**
 * Obtiene la carpeta de Drive para un slug de comisión.
 * Si no encuentra la comisión, devuelve la carpeta General.
 */
export function getDriveFolderBySlug(slug: string | null): DriveFolder {
  const folder = DRIVE_FOLDERS.find((f) => f.commissionSlug === slug)
  return folder ?? DRIVE_FOLDERS.find((f) => f.commissionSlug === 'general')!
}

/**
 * Obtiene todas las carpetas de Drive disponibles.
 */
export function getAllDriveFolders(): DriveFolder[] {
  return DRIVE_FOLDERS
}
