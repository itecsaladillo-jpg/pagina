"use client";

import Image from 'next/image';
import Link from 'next/link';
import { MembersAccessButton } from './MembersAccessButton';

interface LoginClientContentProps {
  error?: string;
  errorDesc?: string;
}

/**
 * Pantalla que se muestra cuando hay un error en el proceso OAuth.
 * El login se inicia directamente desde el Navbar o desde el botón de esta página.
 */
export function LoginClientContent({ error, errorDesc }: LoginClientContentProps) {
  const errorMessage = error
    ? decodeURIComponent(error).replace(/_/g, ' ')
    : null;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-gray-950 to-gray-950 pointer-events-none" />

      <div className="relative z-10 bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="cursor-pointer">
            <Image
              src="/logoitectrans_v2.png"
              alt="ITEC Saladillo"
              width={220}
              height={82}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Ícono de error */}
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          Hubo un problema al iniciar sesión
        </h1>

        {errorMessage && (
          <div className="mb-5 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            <p className="font-medium mb-1">Error:</p>
            <p className="capitalize">{errorMessage}</p>
            {errorDesc && (
              <p className="text-red-400/70 text-xs mt-1">{decodeURIComponent(errorDesc)}</p>
            )}
          </div>
        )}

        <p className="text-gray-400 text-sm mb-6">
          Por favor, intentá iniciar sesión nuevamente con tu cuenta de Google autorizada.
        </p>

        {/* Botón para reintentar — dispara OAuth directo */}
        <MembersAccessButton className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continuar con Google</span>
        </MembersAccessButton>

        <Link
          href="/"
          className="mt-4 inline-block text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          ← Volver a la página principal
        </Link>
      </div>
    </div>
  );
}
