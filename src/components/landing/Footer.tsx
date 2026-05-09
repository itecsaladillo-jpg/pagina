import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logoitectrans.png"
              alt="ITEC Augusto Cicaré"
              width={160}
              height={60}
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <a href="#nosotros" className="hover:text-[var(--accent-cyan-2)] transition-colors">Nosotros</a>
            <a href="#comisiones" className="hover:text-[var(--accent-cyan-2)] transition-colors">Comisiones</a>
            <a href="#capacitaciones" className="hover:text-[var(--accent-cyan-2)] transition-colors">Capacitaciones</a>
            <a href="#ideas" className="hover:text-[var(--accent-cyan-2)] transition-colors">Ideas</a>
          </div>

          {/* Login */}
          <Link href="/login" className="btn-outline text-sm py-2 px-5">
            Acceso Miembros
          </Link>
        </div>

        <div className="section-divider my-8" />

        <p className="text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} ITEC Augusto Cicaré — Todos los derechos reservados
        </p>
      </div>
    </footer>
  )
}
