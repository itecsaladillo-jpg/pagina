'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const [avatarUrl, setAvatarUrl] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="%233b82f6"/><text x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-weight="bold">IT</text></svg>');
  const [conversacionGuardada, setConversacionGuardada] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const mensajesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const intercambiosRef = useRef(0);

  // Generar o recuperar sessionId
  useEffect(() => {
    let id = localStorage.getItem('itec_session_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('itec_session_id', id);
    }
    setSessionId(id);
  }, []);

  // Fetch avatar on mount
  useEffect(() => {
    async function fetchAvatar() {
      const supabase = createClient();
      const { data } = await supabase.rpc('obtener_miembros_publicos');
      
      if (data && Array.isArray(data)) {
        const asistente = data.find((m: any) => m.full_name?.toLowerCase().includes('asistente'));
        if (asistente?.avatar_url) {
          setAvatarUrl(asistente.avatar_url);
          return;
        }
      }
      setAvatarUrl('/asistente.png');
    }
    fetchAvatar();
  }, []);

  // Auto-scroll al último mensaje solo si el usuario envía o al cargar
  useEffect(() => {
    if (mensajesRef.current) {
      const isLastUser = mensajes[mensajes.length - 1]?.rol === 'user';
      if (cargando || isLastUser || mensajes.length === 1) {
        mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
      }
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
      const historial = mensajes.map(m => ({ role: m.rol === 'user' ? 'user' : 'model', content: m.texto }));
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: texto, historial, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error del servidor (${res.status})`);
      }

      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'bot', texto: data.respuesta || 'Sin respuesta.' }]);
      
      if (data.guardado) {
        setConversacionGuardada(true);
      }
      
      intercambiosRef.current += 1;
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
          <div className="itec-avatar">
            <img src={avatarUrl} alt="Asistente ITEC" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style=\"display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#3b82f6;border-radius:50%;color:white;font-weight:bold;font-size:16px\">IT</span>'; }} />
          </div>
          <div className="itec-header-info">
            <div className="itec-header-name">Asistente ITEC</div>
            <div className="itec-header-status">En línea · iTec LLaMA 3.1</div>
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
