'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface Mensaje {
  role: 'user' | 'model';
  text: string;
}

// ─────────────────────────────────────────────
// Sub-componente: Indicador de escritura (tres puntitos)
// ─────────────────────────────────────────────
function TypingIndicator({ avatar }: { avatar: string | null }) {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* Avatar del asistente */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
        {avatar ? (
          <img src={avatar} alt="Asistente" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        )}
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
// Función para parsear texto básico de Markdown (negritas y saltos de línea)
// ─────────────────────────────────────────────
function renderizarContenidoChat(texto: string) {
  const lineas = texto.split('\n');
  return lineas.map((linea, indexLinea) => {
    // Buscar patrones de negrita **texto**
    const partes = linea.split(/\*\*([\s\S]*?)\*\*/g);
    const elementosLinea = partes.map((parte, indexParte) => {
      // Las partes impares son el contenido dentro de **
      if (indexParte % 2 === 1) {
        return <strong key={indexParte} className="font-extrabold text-white">{parte}</strong>;
      }
      return parte;
    });

    return (
      <span key={indexLinea} className="block min-h-[1.2em]">
        {elementosLinea}
      </span>
    );
  });
}

// ─────────────────────────────────────────────
// Sub-componente: Burbuja de mensaje
// ─────────────────────────────────────────────
function BurbujaMensaje({ msg, index, avatar }: { msg: Mensaje; index: number; avatar: string | null }) {
  const esAsistente = msg.role === 'model';

  return (
    <div
      data-role={msg.role}
      className={`mensaje-bubble flex items-end gap-2 mb-3 ${esAsistente ? '' : 'flex-row-reverse'}`}
      style={{
        animation: 'itec-msg-in 0.3s ease-out both',
        animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
      }}
    >
      {/* Avatar */}
      {esAsistente ? (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
          {avatar ? (
            <img src={avatar} alt="Asistente" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )}
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
              whiteSpace: 'pre-wrap',
            }
            : {
              background: 'rgba(100,116,139,0.2)',
              border: '1px solid rgba(100,116,139,0.25)',
              borderRadius: '1rem 1rem 0.25rem 1rem',
              color: '#cbd5e1',
              whiteSpace: 'pre-wrap',
            }
        }
      >
        {renderizarContenidoChat(msg.text)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export function AsistenteChat() {
  const { dict, language } = useLanguage();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputValor, setInputValor] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarAsistente, setAvatarAsistente] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc('obtener_miembros_publicos');
        if (data) {
          const asistente = data.find((m: any) => 
            m.full_name?.toLowerCase().includes('asistente')
          );
          if (asistente?.avatar_url) {
            setAvatarAsistente(asistente.avatar_url);
          }
        }
      } catch (err) {
        console.error('Error fetching assistant avatar:', err);
      }
    };
    fetchAvatar();
  }, []);

  // Estados de feedback y auto-aprendizaje
  const [pantalla, setPantalla] = useState<'chat' | 'feedback'>('chat');
  const [calificacion, setCalificacion] = useState<string | null>(null);
  const [feedbackComentario, setFeedbackComentario] = useState('');
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Sincronizar mensaje de bienvenida según idioma de manera reactiva
  useEffect(() => {
    if (mensajes.length === 0) {
      setMensajes([{
        role: 'model',
        text: dict.asistente.bienvenida
      }]);
    } else {
      setMensajes(prev => {
        if (prev.length === 1 && prev[0].role === 'model') {
          return [{
            role: 'model',
            text: dict.asistente.bienvenida
          }];
        }
        return prev;
      });
    }
  }, [dict]);

  // Función para resetear completamente el chat
  const resetearChat = useCallback(() => {
    setPantalla('chat');
    setMensajes([]);
    setInputValor('');
    setCalificacion(null);
    setFeedbackComentario('');
    setFeedbackEnviado(false);
    setError(null);
  }, []);

  // Enviar feedback brindado activamente
  const enviarFeedback = async () => {
    if (!calificacion || enviandoFeedback) return;

    setEnviandoFeedback(true);
    setError(null);

    try {
      const res = await fetch('/api/asistente/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historial: mensajes.filter((_, idx) => idx > 0),
          calificacion,
          comentario: feedbackComentario,
        }),
      });

      if (!res.ok) {
        throw new Error(dict.asistente.errorFeedback);
      }

      setFeedbackEnviado(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(msg);
    } finally {
      setEnviandoFeedback(false);
    }
  };

  // Guardar que el usuario cerró el chat sin feedback explícito
  const enviarFeedbackSilencioso = async () => {
    setAbierto(false);
    resetearChat();

    // Enviamos el feedback silencioso en segundo plano sin interrumpir al usuario
    try {
      await fetch('/api/asistente/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historial: mensajes.filter((_, idx) => idx > 0),
          calificacion: 'cerrado_sin_feedback',
        }),
      });
    } catch {
      // Ignorar errores silenciosos en llamadas de fondo
    }
  };

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    
    // Usamos un pequeño temporizador para esperar a que el DOM se actualice por completo
    const timer = setTimeout(() => {
      const bubbleElements = container.querySelectorAll('.mensaje-bubble');
      if (bubbleElements.length > 0) {
        const lastBubble = bubbleElements[bubbleElements.length - 1] as HTMLElement;
        const lastRole = lastBubble.getAttribute('data-role');

        if (lastRole === 'model') {
          // Si el último mensaje es del asistente, hacemos scroll hasta el inicio de esa burbuja
          // en lugar del final absoluto del scroll.
          const containerTop = container.getBoundingClientRect().top;
          const bubbleTop = lastBubble.getBoundingClientRect().top;
          const targetScrollTop = container.scrollTop + (bubbleTop - containerTop) - 12; // 12px de margen superior

          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth',
          });
        } else {
          // Si es del usuario, scrolleamos hasta el fondo para ver su mensaje e indicador
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
        }
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);

    return () => clearTimeout(timer);
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

    // Construimos el historial previo sin la bienvenida inicial
    const historialParaAPI = mensajes.filter((_, idx) => idx > 0);

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
          idioma: language,
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
          aria-label={dict.asistente.titulo}
          onClick={() => setAbierto(true)}
          className="itec-fab fixed bottom-6 left-6 z-50 h-14 rounded-full flex items-center gap-3 px-5 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            animation: 'itec-btn-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both, itec-glow-pulse 3s ease-in-out 1.5s infinite',
            boxShadow: '0 0 24px rgba(59,130,246,0.45)',
          }}
        >
          {/* Ícono de chat + badge */}
          <div className="relative flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            {/* Badge de notificación */}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white/20" />
          </div>
          {/* Texto */}
          <span className="text-white font-bold text-sm tracking-wide whitespace-nowrap">
            {dict.asistente.titulo}
          </span>
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
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                >
                  {avatarAsistente ? (
                    <img src={avatarAsistente} alt="Asistente" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  )}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400"
                  style={{ border: '1.5px solid #0a0f1e' }}
                />
              </div>

              <div>
                <p className="text-sm font-semibold leading-none" style={{ color: '#e2e8f0' }}>
                  {dict.asistente.titulo}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#22d3ee' }}>
                  {isPending ? dict.asistente.escribiendo : dict.asistente.online}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Botón Finalizar Consulta (visible si hay intercambio y estamos en pantalla chat) */}
              {pantalla === 'chat' && mensajes.length > 1 && (
                <button
                  id="asistente-itec-finalizar"
                  onClick={() => setPantalla('feedback')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all duration-150 hover:bg-blue-500/20 active:scale-95 cursor-pointer"
                  style={{
                    color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.3)',
                    background: 'rgba(59,130,246,0.06)'
                  }}
                  title={dict.asistente.finalizar}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>{dict.asistente.finalizar}</span>
                </button>
              )}

              {/* Botón cerrar */}
              <button
                id="asistente-itec-cerrar"
                aria-label={dict.asistente.soloCerrar}
                onClick={() => {
                  if (pantalla === 'chat' && mensajes.length > 1) {
                    setPantalla('feedback');
                  } else {
                    setAbierto(false);
                    resetearChat();
                  }
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                style={{ color: '#64748b' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {pantalla === 'chat' ? (
            <>
              {/* ── Área de mensajes ── */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar"
                style={{ overscrollBehavior: 'contain' }}
              >
                {mensajes.map((msg, i) => (
                  <BurbujaMensaje key={i} msg={msg} index={i} avatar={avatarAsistente} />
                ))}
                {isPending && <TypingIndicator avatar={avatarAsistente} />}

                {/* Error inline */}
                {error && (
                  <div
                    className="text-xs px-3 py-2 rounded-lg mb-3 flex items-start gap-2"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{error === 'Error al enviar el feedback al servidor.' ? dict.asistente.errorFeedback : error}</span>
                  </div>
                )}
              </div>

              {/* ── Sugerencias rápidas (solo si no hay historial extenso) ── */}
              {mensajes.length <= 1 && !isPending && (
                <div
                  className="flex gap-1.5 px-4 pb-2 flex-wrap flex-shrink-0"
                  style={{ borderTop: '1px solid rgba(59,130,246,0.08)' }}
                >
                  {dict.asistente.sugerencias.map((s) => (
                    <button
                      key={s}
                      onClick={() => enviarMensaje(s)}
                      className="text-[10px] px-2.5 py-1 rounded-full transition-all duration-150 whitespace-nowrap mt-2 cursor-pointer"
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
                  placeholder={dict.asistente.placeholder}
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
                  aria-label={dict.asistente.enviarCerrar}
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
            </>
          ) : (
            /* ── Pantalla de Feedback Interactiva ── */
            <div 
              className="flex-1 flex flex-col justify-between p-5 overflow-y-auto"
              style={{ animation: 'itec-window-in 0.2s ease-out both' }}
            >
              <div className="flex-1 flex flex-col justify-center">
                {/* Cabecera de feedback */}
                <div className="text-center mb-6">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M11.48 3.499c-.196-.399-.778-.399-.974 0L7.93 7.848l-4.81.362c-.452.034-.633.597-.291.905l3.58 3.238-1.012 4.73c-.095.447.382.793.766.556L10 15.234l4.135 2.148c.384.237.86-.109.767-.556l-1.012-4.73 3.58-3.238c.34-.308.16-.871-.291-.905l-4.81-.362-2.58-4.349z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">{dict.asistente.preguntaFeedback}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">{dict.asistente.descFeedback}</p>
                </div>

                {/* Calificaciones */}
                {!feedbackEnviado ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'muy_util', label: dict.asistente.muyUtil, emoji: '😄', color: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)', textColor: '#4ade80' },
                        { id: 'util', label: dict.asistente.util, emoji: '🙂', color: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)', textColor: '#60a5fa' },
                        { id: 'neutral', label: dict.asistente.neutral, emoji: '😐', color: 'rgba(100,116,139,0.12)', borderColor: 'rgba(100,116,139,0.3)', textColor: '#94a3b8' },
                        { id: 'poco_util', label: dict.asistente.pocoUtil, emoji: '🙁', color: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', textColor: '#fca5a5' }
                      ].map((item) => {
                        const seleccionado = calificacion === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setCalificacion(item.id)}
                            className="flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all duration-200 text-left cursor-pointer border hover:scale-[1.02] active:scale-95"
                            style={{
                              background: seleccionado ? item.color : 'rgba(15,23,41,0.5)',
                              borderColor: seleccionado ? item.textColor : 'rgba(59,130,246,0.1)',
                              color: seleccionado ? item.textColor : '#94a3b8',
                              boxShadow: seleccionado ? `0 0 10px ${item.color}` : 'none'
                            }}
                          >
                            <span className="text-base">{item.emoji}</span>
                            <span className="font-semibold text-[11px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Comentarios */}
                    {calificacion && (
                      <div style={{ animation: 'itec-msg-in 0.2s ease-out both' }}>
                        <label htmlFor="feedback-textarea" className="block text-[10px] text-slate-400 mb-1 font-medium">
                          {dict.asistente.comentarioFeedback}
                        </label>
                        <textarea
                          id="feedback-textarea"
                          rows={2}
                          value={feedbackComentario}
                          onChange={(e) => setFeedbackComentario(e.target.value)}
                          placeholder={dict.asistente.placeholderFeedback}
                          className="w-full text-xs py-2 px-3 rounded-xl outline-none transition-colors duration-150 leading-relaxed resize-none"
                          style={{
                            background: 'rgba(15,23,41,0.8)',
                            border: '1px solid rgba(59,130,246,0.18)',
                            color: '#e2e8f0',
                            caretColor: '#60a5fa',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.18)';
                          }}
                        />
                      </div>
                    )}

                    {/* Error de envío */}
                    {error && (
                      <div className="text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        <span>⚠️ {error === 'Error al enviar el feedback al servidor.' ? dict.asistente.errorFeedback : error}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Éxito */
                  <div className="text-center py-6" style={{ animation: 'itec-msg-in 0.25s ease-out both' }}>
                    <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h4 className="text-xs font-bold text-green-400">{dict.asistente.exitoFeedback}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 px-4 leading-relaxed">
                      {dict.asistente.descExitoFeedback}
                    </p>
                  </div>
                )}
              </div>

              {/* Botones de acción de feedback */}
              <div className="flex gap-2 mt-6 flex-shrink-0" style={{ borderTop: '1px solid rgba(59,130,246,0.1)', paddingTop: '14px' }}>
                {!feedbackEnviado ? (
                  <>
                    <button
                      onClick={() => enviarFeedback()}
                      disabled={enviandoFeedback || !calificacion}
                      className="flex-1 h-9 rounded-xl font-bold text-xs text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                      style={{
                        background: !calificacion || enviandoFeedback 
                          ? 'rgba(59,130,246,0.1)' 
                          : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        cursor: !calificacion || enviandoFeedback ? 'not-allowed' : 'pointer',
                        boxShadow: calificacion && !enviandoFeedback ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                        color: !calificacion || enviandoFeedback ? '#475569' : 'white'
                      }}
                    >
                      {enviandoFeedback ? (
                        <svg className="w-3.5 h-3.5 animate-spin" style={{ color: '#60a5fa' }} fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                          <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        dict.asistente.enviarCerrar
                      )}
                    </button>
                    <button
                      onClick={() => enviarFeedbackSilencioso()}
                      disabled={enviandoFeedback}
                      className="px-3 h-9 rounded-xl text-xs font-semibold transition-colors duration-150 hover:bg-white/5 cursor-pointer text-slate-400"
                      style={{ border: '1px solid rgba(100,116,139,0.2)' }}
                    >
                      {dict.asistente.soloCerrar}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setAbierto(false);
                      resetearChat();
                    }}
                    className="flex-1 h-9 rounded-xl font-bold text-xs text-white flex items-center justify-center cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                  >
                    {dict.asistente.cerrarVentana}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
