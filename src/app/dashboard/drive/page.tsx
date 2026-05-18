import { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DRIVE_FOLDERS, getDriveFolderBySlug } from '@/lib/drive'
import { Folder, ExternalLink, Cloud, ShieldCheck, Clock, Share2, FileCode } from 'lucide-react'
import { FileList } from './FileList'

export const metadata: Metadata = {
  title: 'Nube de Archivos — ITEC',
}

export default async function DrivePage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()

  // Obtener la comisión del miembro
  const { data: memberCommissions } = await supabase
    .from('commission_members')
    .select(`
      commissions ( slug, name )
    `)
    .eq('member_id', member.id)

  // Obtener configuración global (para el ID de la carpeta raíz)
  const { data: settings } = await supabase
    .from('site_settings')
    .select('google_drive_root_id')
    .single()

  // Manejar el hecho de que Supabase puede devolver un objeto o un array para la relación
  const firstCommission = memberCommissions?.[0]?.commissions
  const commissionData = Array.isArray(firstCommission) ? firstCommission[0] : firstCommission
  
  const userCommissionSlug = commissionData?.slug || null
  const userFolder = getDriveFolderBySlug(userCommissionSlug)
  
  // Si hay un ID configurado en settings, lo usamos para la carpeta general
  const generalFolder = settings?.google_drive_root_id 
    ? { ...getDriveFolderBySlug('general'), folderId: settings.google_drive_root_id, folderUrl: `https://drive.google.com/drive/folders/${settings.google_drive_root_id}` }
    : getDriveFolderBySlug('general')

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Cloud className="text-[var(--accent-primary-2)]" size={32} />
          Nube de Archivos
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Accedé a la documentación, materiales y recursos compartidos en Google Drive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carpeta de la Comisión */}
        <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Folder size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 flex items-center justify-center mb-6">
              <Folder className="text-[var(--accent-primary-2)]" size={24} />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Mi Comisión</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs">
              Acceso exclusivo para miembros de <span className="text-white font-medium">{userFolder.commissionName}</span>.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <ShieldCheck size={14} className="text-green-500" />
                <span>Acceso restringido a miembros</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <Share2 size={14} className="text-blue-500" />
                <span>Colaboración en tiempo real</span>
              </div>
            </div>
            
            <FileList folderId={userFolder.folderId} title="Mi Comisión" />

            <a
              href={userFolder.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-3 group/btn"
            >
              <span>Abrir Carpeta de Comisión</span>
              <ExternalLink size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Carpeta General */}
        <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cloud size={120} />
          </div>

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-6">
              <Cloud className="text-amber-400" size={24} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Archivo General</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs">
              Documentos institucionales, normativas y recursos abiertos a todo el ITEC.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <ShieldCheck size={14} className="text-amber-500" />
                <span>Acceso de lectura para todos</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <Clock size={14} className="text-purple-500" />
                <span>Actualizado recientemente</span>
              </div>
            </div>

            <FileList folderId={generalFolder.folderId} title="Archivo General" />

            <a
              href={generalFolder.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full py-4 rounded-xl flex items-center justify-center gap-3 group/btn hover:bg-white/5"
            >
              <span>Ver Archivo General</span>
              <ExternalLink size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Información de Ayuda */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex gap-4 items-start">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-1">Sobre el acceso a Drive</h4>
          <p className="text-[var(--text-muted)] text-xs leading-relaxed">
            Para acceder a estas carpetas, debés haber iniciado sesión con tu cuenta de Google institucional o personal vinculada al ITEC. Si no tenés permisos, solicitá acceso al coordinador de tu comisión.
          </p>
        </div>
      </div>
    </div>
  )
}
