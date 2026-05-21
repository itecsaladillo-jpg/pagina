'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface Mensaje {
  role: 'user' | 'model';
  text: string;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────
const MENSAJE_BIENVENIDA: Mensaje = {
  role: 'model',
  text: '¡Hola! Qué bueno encontrarte por acá. Soy el Asistente virtual de ITEC. ¿Te interesa conocer la historia de Augusto Cicaré, sumarte al Mapa Productivo de Saladillo o potenciar tu perfil laboral?',
};

const SUGERENCIAS = [
  '¿Quién fue Augusto Cicaré?',
  'Quiero ser micro-sponsor',
  'Sumar mi PyME al Mapa',
  'Cargar mi perfil laboral',
];

// ─────────────────────────────────────────────
// Sub-componente: Indicador de escritura (tres puntitos)
// ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* Avatar del asistente */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>

      {/* Burbuja con puntitos */}
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: '#60a5fa',
              animation: 'itec-dot-bounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-componente: Burbuja de mensaje
// ─────────────────────────────────────────────
function BurbujaMensaje({ msg, index }: { msg: Mensaje; index: number }) {
  const esAsistente = msg.role === 'model';

  return (
    <div
      className={`flex items-end gap-2 mb-3 ${esAsistente ? '' : 'flex-row-reverse'}`}
      style={{
        animation: 'itec-msg-in 0.3s ease-out both',
        animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
      }}
    >
      {/* Avatar */}
      {esAsistente ? (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(100,116,139,0.3)', border: '1px solid rgba(100,116,139,0.4)' }}>
          <svg className="w-4 h-4" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      )}

      {/* Texto */}
      <div
        className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed"
        style={
          esAsistente
            ? {
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '1rem 1rem 1rem 0.25rem',
              color: '#e2e8f0',
            }
            : {
              background: 'rgba(100,116,139,0.2)',
              border: '1px solid rgba(100,116,139,0.25)',
              borderRadius: '1rem 1rem 0.25rem 1rem',
              color: '#cbd5e1',
            }
        }
      >
        {msg.text}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export function AsistenteChat() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([MENSAJE_BIENVENIDA]);
  const [inputValor, setInputValor] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [mensajes, isPending]);

  // Focus en el input al abrir
  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [abierto]);

  // Enviar mensaje
  const enviarMensaje = useCallback(async (textoOverride?: string) => {
    const texto = (textoOverride ?? inputValor).trim();
    if (!texto || isPending) return;

    const nuevoMensajeUsuario: Mensaje = { role: 'user', text: texto };

    // Construimos el historial previo (sin el bienvenida si es el primer turno)
    const historialParaAPI = mensajes.filter((m) => m !== MENSAJE_BIENVENIDA || mensajes.indexOf(m) > 0);

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setInputValor('');
    setIsPending(true);
    setError(null);

    try {
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: texto,
          historial: historialParaAPI,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }

      const data = await res.json() as { respuesta: string };
      setMensajes((prev) => [...prev, { role: 'model', text: data.respuesta }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(msg);
    } finally {
      setIsPending(false);
      inputRef.current?.focus();
    }
  }, [inputValor, isPending, mensajes]);

  // Enter para enviar (Shift+Enter para nueva línea)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  return (
    <>
      {/* ── Keyframes inyectados como <style> ── */}
      <style>{`
        @keyframes itec-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes itec-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes itec-btn-in {
          from { opacity: 0; transform: scale(0.8) translateX(-10px); }
          to   { opacity: 1; transform: scale(1) translateX(0); }
        }
        @keyframes itec-window-in {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes itec-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.35), 0 0 0 0 rgba(59,130,246,0.4); }
          50%       { box-shadow: 0 0 32px rgba(59,130,246,0.55), 0 0 0 6px rgba(59,130,246,0); }
        }
        .itec-chat-window {
          animation: itec-window-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .itec-fab {
          animation: itec-btn-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
          animation-delay: 1s;
        }
        .itec-fab:hover {
          transform: scale(1.08);
        }
      `}</style>

      {/* ── Botón flotante (FAB) ── */}
      {!abierto && (
        <button
          id="asistente-itec-fab"
          aria-label="Abrir Asistente ITEC"
          onClick={() => setAbierto(true)}
          className="itec-fab fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            animation: 'itec-btn-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both, itec-glow-pulse 3s ease-in-out 1.5s infinite',
            boxShadow: '0 0 24px rgba(59,130,246,0.45)',
          }}
        >
          {/* Ícono de chat */}
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          {/* Badge de notificación */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#030712]" />
        </button>
      )}

      {/* ── Ventana de chat ── */}
      {abierto && (
        <div
          id="asistente-itec-ventana"
          ref={windowRef}
          className="itec-chat-window fixed bottom-6 left-6 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: 'min(380px, calc(100vw - 2rem))',
            height: 'min(560px, calc(100vh - 6rem))',
            background: '#0a0f1e',
            border: '1px solid rgba(59,130,246,0.25)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(59,130,246,0.1)',
          }}
        >

          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              background: 'rgba(15,23,41,0.9)',
              borderBottom: '1px solid rgba(59,130,246,0.15)',
            }}
          >
            <div className="flex items-center gap-2.5">
              {/* Avatar animado */}
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400"
                  style={{ border: '1.5px solid #0a0f1e' }}
                />
              </div>

              <div>
                <p className="text-sm font-semibold leading-none" style={{ color: '#e2e8f0' }}>
                  Asistente ITEC
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#22d3ee' }}>
                  {isPending ? 'Escribiendo...' : 'En línea'}
                </p>
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              id="asistente-itec-cerrar"
              aria-label="Cerrar chat"
              onClick={() => setAbierto(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              style={{ color: '#64748b' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Área de mensajes ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar"
            style={{ overscrollBehavior: 'contain' }}
          >
            {mensajes.map((msg, i) => (
              <BurbujaMensaje key={i} msg={msg} index={i} />
            ))}
            {isPending && <TypingIndicator />}

            {/* Error inline */}
            {error && (
              <div
                className="text-xs px-3 py-2 rounded-lg mb-3 flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── Sugerencias rápidas (solo si no hay historial extenso) ── */}
          {mensajes.length <= 1 && !isPending && (
            <div
              className="flex gap-1.5 px-4 pb-2 flex-wrap flex-shrink-0"
              style={{ borderTop: '1px solid rgba(59,130,246,0.08)' }}
            >
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => enviarMensaje(s)}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-all duration-150 whitespace-nowrap mt-2"
                  style={{
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: '#60a5fa',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.18)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          <div
            className="flex items-end gap-2 px-3 pb-3 pt-2 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(59,130,246,0.12)' }}
          >
            <textarea
              id="asistente-itec-input"
              ref={inputRef}
              rows={1}
              value={inputValor}
              onChange={(e) => setInputValor(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu consulta..."
              disabled={isPending}
              className="flex-1 resize-none text-sm py-2.5 px-3 rounded-xl outline-none transition-colors duration-150 leading-relaxed"
              style={{
                background: 'rgba(15,23,41,0.8)',
                border: '1px solid rgba(59,130,246,0.18)',
                color: '#e2e8f0',
                minHeight: '42px',
                maxHeight: '96px',
                caretColor: '#60a5fa',
                scrollbarWidth: 'none',
              }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.18)';
              }}
            />

            {/* Botón enviar */}
            <button
              id="asistente-itec-enviar"
              aria-label="Enviar mensaje"
              onClick={() => enviarMensaje()}
              disabled={isPending || !inputValor.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              style={{
                background:
                  isPending || !inputValor.trim()
                    ? 'rgba(59,130,246,0.15)'
                    : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                cursor: isPending || !inputValor.trim() ? 'not-allowed' : 'pointer',
                boxShadow:
                  !isPending && inputValor.trim()
                    ? '0 4px 15px rgba(59,130,246,0.35)'
                    : 'none',
              }}
            >
              {isPending ? (
                <svg className="w-4 h-4 animate-spin" style={{ color: '#60a5fa' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>

          {/* ── Footer con branding ── */}
          <div className="text-center pb-2 flex-shrink-0">
            <span className="text-[9px]" style={{ color: '#334155' }}>
              Powered by{' '}
              <span style={{ color: '#475569' }}>Gemini · ITEC Saladillo</span>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
