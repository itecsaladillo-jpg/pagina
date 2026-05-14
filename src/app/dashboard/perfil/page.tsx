import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'

export default async function PerfilPage() {
  const member = await getCurrentMember()

  if (!member) redirect('/login')

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Gestiona tus datos personales y de contacto en el ITEC Saladillo.
        </p>
      </div>

      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8">
        <ProfileForm member={member} />
      </div>
    </div>
  )
}
