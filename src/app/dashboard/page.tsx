import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const member = await getCurrentMember()

  if (!member) redirect('/login')
  if (member.status !== 'activo') redirect('/acceso-pendiente')

  return (
    <div>
      {/* Header de bienvenida */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Hola, {member.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Bienvenido al panel de control del ITEC Saladillo
        </p>
      </div>

      {/* Tarjeta de perfil rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass border border-[var(--border-subtle)] rounded-xl p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--accent-primary-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <span className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Mi Perfil</span>
          </div>
          <p className="text-white font-semibold">{member.full_name}</p>
          <p className="text-[var(--text-muted)] text-xs mt-1 capitalize">{member.role}</p>
        </div>

        <div className="glass border border-[var(--border-subtle)] rounded-xl p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <span className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Estado</span>
          </div>
          <p className="text-white font-semibold capitalize">{member.status}</p>
          <p className="text-[var(--text-muted)] text-xs mt-1">Miembro desde {new Date(member.join_date).getFullYear()}</p>
        </div>

        <div className="glass border border-[var(--border-subtle)] rounded-xl p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z" />
              </svg>
            </div>
            <span className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Email</span>
          </div>
          <p className="text-white font-semibold text-sm truncate">{member.email}</p>
          <p className="text-[var(--text-muted)] text-xs mt-1">Cuenta Google</p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="glass border border-[var(--border-subtle)] rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Mis capacitaciones', href: '/dashboard/capacitaciones', color: 'blue' },
            { label: 'Mis comisiones', href: '/dashboard/comisiones', color: 'cyan' },
            { label: 'Buzón de ideas', href: '/dashboard/ideas', color: 'green' },
            { label: 'Directorio', href: '/dashboard/miembros', color: 'amber' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="btn-outline text-xs py-3 px-4 text-center justify-center border-dashed hover:opacity-100 opacity-70"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
