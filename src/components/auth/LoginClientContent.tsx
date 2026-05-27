"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { GoogleSignInButton } from './GoogleSignInButton';

export function LoginClientContent({ error }: { error?: string }) {
  const { dict } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-gray-950 to-gray-950 pointer-events-none" />

      <div className="relative z-10 bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-md text-center shadow-2xl">
        {/* Logo real */}
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

        <p className="text-gray-400 mb-8 text-sm">
          {dict.login.exclusivoMiembros}
        </p>

        {/* Error de auth */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {dict.login.errorAuth}
          </div>
        )}

        {/* Botón Google conectado */}
        <GoogleSignInButton />

        <p className="mt-6 text-xs text-gray-600">
          {dict.login.aceptasTerminos}
        </p>
      </div>
    </div>
  );
}
