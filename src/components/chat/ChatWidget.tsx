'use client';

import { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

interface Mensaje {
  rol: 'bot' | 'user' | 'error';
  texto: string;
}

export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'bot', texto: '¡Hola! Soy el Asistente Virtual del ITEC. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const mensajesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  // Foco al abrir
  useEffect(() => {
    if (abierto) inputRef.current?.focus();
  }, [abierto]);

  async function enviar() {
    const texto = input.trim();
    if (!texto || cargando) return;

    setInput('');
    setMensajes(prev => [...prev, { rol: 'user', texto }]);
    setCargando(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: texto }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error del servidor (${res.status})`);
      }

      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'bot', texto: data.reply || 'Sin respuesta.' }]);
    } catch (e: any) {
      setMensajes(prev => [
        ...prev,
        { rol: 'error', texto: '⚠️ ' + (e.message || 'Error de conexión. Verifica que el servidor esté activo.') }
      ]);
    } finally {
      setCargando(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        id="itec-chat-btn"
        className="itec-chat-btn"
        onClick={() => setAbierto(v => !v)}
        aria-label="Abrir asistente ITEC"
      >
        {abierto ? (
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
        )}
      </button>

      {/* Ventana del chat */}
      <div
        className={`itec-chat-window${abierto ? ' open' : ''}`}
        role="dialog"
        aria-label="Asistente ITEC"
      >
        {/* Header */}
        <div className="itec-chat-header">
          <div className="itec-avatar">🎓</div>
          <div className="itec-header-info">
            <div className="itec-header-name">Asistente ITEC</div>
            <div className="itec-header-status">En línea · Groq LLaMA 3.1</div>
          </div>
          <button
            className="itec-close-btn"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar chat"
          >✕</button>
        </div>

        {/* Mensajes */}
        <div className="itec-messages" ref={mensajesRef}>
          {mensajes.map((m, i) => (
            <div key={i} className={`itec-msg ${m.rol}`}>
              {m.texto}
            </div>
          ))}

          {/* Indicador de carga */}
          {cargando && (
            <div className="itec-typing">
              <span /><span /><span />
            </div>
          )}
        </div>

        {/* Área de input */}
        <div className="itec-input-area">
          <textarea
            ref={inputRef}
            className="itec-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe tu consulta..."
            rows={1}
            disabled={cargando}
            aria-label="Mensaje para el asistente"
          />
          <button
            className="itec-send-btn"
            onClick={enviar}
            disabled={cargando || !input.trim()}
            aria-label="Enviar mensaje"
          >
            <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
