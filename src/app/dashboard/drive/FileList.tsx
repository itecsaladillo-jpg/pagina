'use client'

import { useEffect, useState } from 'react'
import { getFolderFilesAction } from './actions'
import { FileText, Folder, ExternalLink, Loader2, File as FileIcon, Clock } from 'lucide-react'

interface Props {
  folderId: string
  title: string
}

export function FileList({ folderId, title }: Props) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFiles() {
      if (!folderId || folderId.includes('REEMPLAZAR')) {
        setLoading(false)
        return
      }
      
      const res = await getFolderFilesAction(folderId)
      if (res.success) {
        setFiles(res.files || [])
      } else {
        setError(res.error || 'Error al cargar archivos')
      }
      setLoading(false)
    }
    loadFiles()
  }, [folderId])

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-[var(--text-muted)] text-xs animate-pulse p-4">
        <Loader2 className="animate-spin" size={14} />
        <span>Sincronizando con Google Drive...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-amber-500/70 text-[10px] italic">
        * Nota: Configura la Cuenta de Servicio en Ajustes para ver archivos en tiempo real.
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-[var(--text-muted)] text-[10px] italic">
        No se encontraron archivos o la carpeta es privada.
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
      <h4 className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-3 ml-1">Archivos Recientes</h4>
      {files.slice(0, 5).map((file) => (
        <a
          key={file.id}
          href={file.webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              {file.mimeType === 'application/vnd.google-apps.folder' ? (
                <Folder size={14} className="text-amber-400" />
              ) : (
                <FileIcon size={14} className="text-blue-400" />
              )}
            </div>
            <div>
              <p className="text-white text-xs font-medium truncate max-w-[180px]">{file.name}</p>
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-[9px]">
                <Clock size={10} />
                <span>{new Date(file.modifiedTime).toLocaleDateString('es-AR')}</span>
              </div>
            </div>
          </div>
          <ExternalLink size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  )
}
