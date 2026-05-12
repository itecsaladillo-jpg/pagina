import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceso Pendiente — ITEC Augusto Cicaré',
}

export default function AccesoPendientePage() {
  return (
    <div className="min-h-screen bg-black grid-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-black pointer-events-none" />

      <div className="relative z-10 glass border border-[var(--border-glow)] rounded-2xl p-10 w-full max-w-md text-center shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logoitectrans_v2.png"
            alt="ITEC Augusto Cicaré"
            width={180}
            height={68}
            className="h-16 w-auto object-contain"
            priority
          />
        </div>

        {/* Icono de reloj */}
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Tu acceso está pendiente
        </h1>

        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          Tu cuenta fue creada correctamente. Un administrador del ITEC debe
          activarla antes de que puedas ingresar al panel.
          <br /><br />
          Recibirás un correo electrónico cuando tu acceso sea aprobado.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-primary text-sm py-3 justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span>Volver a la página principal</span>
          </Link>

          {/* Botón de cerrar sesión */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full btn-outline text-xs py-2 px-4 opacity-70 hover:opacity-100"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
