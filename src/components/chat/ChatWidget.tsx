'use client';

import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: '¡Hola! Soy el asistente virtual oficial del ITEC. ¿En qué te puedo ayudar hoy?', sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, errorMsg]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setErrorMsg('');
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInputValue('');
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setErrorMsg('Hubo un error al comunicarse con el servidor. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div id="itec-chatbot-widget">
      <div id="itec-chat-window" className={!isOpen ? 'itec-hidden' : ''} role="dialog" aria-label="Chatbot ITEC">
        <div className="itec-chat-header">
          <span>Asistente ITEC</span>
          <button id="itec-chat-close" onClick={toggleChat} aria-label="Cerrar chat">&times;</button>
        </div>
        
        <div id="itec-chat-messages" aria-live="polite">
          {messages.map((msg, index) => (
            <div key={index} className={`itec-message itec-${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          
          {isLoading && (
            <div className="itec-loading" id="itec-loader">
              <div className="itec-dot"></div>
              <div className="itec-dot"></div>
              <div className="itec-dot"></div>
            </div>
          )}

          {errorMsg && (
            <div className="itec-error-msg">
              {errorMsg}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="itec-chat-input-area">
          <input 
            type="text" 
            id="itec-chat-input" 
            placeholder="Escribe tu consulta..." 
            aria-label="Escribe tu mensaje" 
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            id="itec-chat-send" 
            onClick={sendMessage} 
            disabled={isLoading || !inputValue.trim()}
            aria-label="Enviar mensaje"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </div>
      </div>

      <button id="itec-chat-fab" onClick={toggleChat} aria-label="Abrir asistente de chat">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
        </svg>
      </button>
    </div>
  );
}
