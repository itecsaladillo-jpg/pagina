"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Tv, UserPlus, ShieldAlert, QrCode, Copy, Check, Printer, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import type { ItecAction } from "@/types/database";

export default function EventListClient({ initialActions }: { initialActions: ItecAction[] }) {
  const [actions] = useState<ItecAction[]>(initialActions);
  const [activeQrEvent, setActiveQrEvent] = useState<ItecAction | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (activeQrEvent && typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/eventos/${activeQrEvent.id}/preguntar`);
    } else {
      setQrUrl("");
    }
  }, [activeQrEvent]);

  const handleCopyLink = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>ITEC Saladillo Q&A - Código QR</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #ffffff;
              color: #0f172a;
              text-align: center;
            }
            .container {
              border: 2px solid #e2e8f0;
              padding: 40px;
              border-radius: 24px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              max-width: 400px;
            }
            h1 {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 8px;
            }
            p {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 24px;
            }
            .qr-wrapper {
              padding: 16px;
              background: #f8fafc;
              border-radius: 16px;
              display: inline-block;
            }
            .footer {
              margin-top: 32px;
              font-size: 12px;
              color: #94a3b8;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Preguntas en Vivo</h1>
            <p>Escaneá con tu celular para enviar preguntas y votar otras consultas del evento</p>
            <div class="qr-wrapper">
              <svg width="250" height="250" viewBox="0 0 256 256">
                ${document.getElementById("qr-code-svg")?.innerHTML || ""}
              </svg>
            </div>
            <div class="footer">${activeQrEvent?.title} - ITEC</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      {/* Grid de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions && actions.length > 0 ? (
          actions.map((action) => (
            <motion.div 
              key={action.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className={`rounded-3xl border p-6 bg-zinc-900/40 backdrop-blur-sm shadow-xl flex flex-col justify-between transition-all ${
                action.status === 'en_curso' 
                  ? 'border-indigo-500/30 bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-indigo-950/20' 
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    action.status === 'en_curso'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse'
                      : 'bg-zinc-850 text-zinc-400 border-zinc-800'
                  }`}>
                    {action.status === 'en_curso' ? 'En Vivo' : action.status.replace('_', ' ')}
                  </span>
                  
                  <span className="text-xs text-zinc-500 font-medium">
                    {action.start_date ? new Date(action.start_date).toLocaleDateString('es-AR') : 'Sin fecha'}
                  </span>
                </div>

                {/* Título y descripción */}
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{action.title}</h3>
                <p className="text-sm text-zinc-400 mb-6 line-clamp-2 leading-relaxed">
                  {action.description || 'Sin descripción para esta acción.'}
                </p>
              </div>

              {/* Controles de Herramientas de Evento */}
              <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                {/* Sección 1: Preguntas en Vivo (Q&A) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400">Preguntas al Orador (Q&A)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href={`/eventos/${action.id}/preguntar`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-zinc-950/40 hover:bg-zinc-900 text-white text-[11px] font-bold transition-all border border-zinc-800 hover:border-zinc-700"
                    >
                      <UserPlus size={12} className="text-indigo-400" />
                      📱 Celular
                    </Link>
                    <button
                      onClick={() => setActiveQrEvent(action)}
                      className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-zinc-950/40 hover:bg-zinc-900 text-white text-[11px] font-bold transition-all border border-zinc-800 hover:border-zinc-700 cursor-pointer"
                    >
                      <QrCode size={12} className="text-blue-400" />
                      QR Code
                    </button>
                    <Link
                      href={`/eventos/${action.id}/pantalla-preguntas`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-zinc-950/40 hover:bg-zinc-900 text-white text-[11px] font-bold transition-all border border-zinc-800 hover:border-zinc-700"
                    >
                      <Tv size={12} className="text-emerald-400" />
                      🖥️ Proyector
                    </Link>
                  </div>
                  <Link
                    href={`/dashboard/eventos/${action.id}/moderacion`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-[11px] font-extrabold tracking-wider uppercase transition-all shadow-md active:scale-[0.98]"
                  >
                    <ShieldAlert size={13} />
                    Moderar Preguntas
                  </Link>
                </div>

                {/* Sección 2: Nube de Ideas */}
                <div className="space-y-2 pt-2.5 border-t border-zinc-800/40">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-purple-400 flex items-center gap-1">
                      <Sparkles size={9} /> Nube de Ideas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/eventos/${action.id}/nube`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-950/40 hover:bg-zinc-900 text-white text-xs font-bold transition-all border border-zinc-800 hover:border-zinc-700"
                    >
                      <UserPlus size={13} className="text-purple-400" />
                      📱 Celular
                    </Link>
                    <Link
                      href={`/eventos/${action.id}/pantalla-nube`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-950/40 hover:bg-zinc-900 text-white text-xs font-bold transition-all border border-zinc-800 hover:border-zinc-700"
                    >
                      <Tv size={13} className="text-purple-400" />
                      🖥️ Proyector
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20 space-y-4">
            <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">No hay acciones registradas</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
              Cargá un evento o capacitación en tu panel de ITEC para habilitar el Q&A y la proyección en vivo.
            </p>
            <div className="pt-2">
              <Link 
                href="/dashboard/acciones/nueva"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider"
              >
                Crear Primer Evento
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal overlay */}
      <AnimatePresence>
        {activeQrEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveQrEvent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 max-w-md w-full shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={() => setActiveQrEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-zinc-400 hover:text-white transition-all hover:bg-white/[0.06]"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <QrCode size={24} />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Código QR del Asistente</h3>
                  <p className="text-xs text-zinc-400 px-4 leading-relaxed">
                    Mostrá o imprimí este código QR para que la audiencia pueda escanearlo y enviar preguntas desde sus teléfonos.
                  </p>
                </div>

                {/* QR Renderer */}
                <div className="my-6 p-4 bg-white rounded-2xl inline-block border border-zinc-200">
                  {qrUrl && (
                    <QRCode
                      id="qr-code-svg"
                      value={qrUrl}
                      size={180}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                    />
                  )}
                </div>

                {/* Event Name */}
                <div className="bg-zinc-950 border border-zinc-800/80 px-4 py-2 rounded-2xl inline-flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase tracking-widest max-w-[90%] mx-auto">
                  <Sparkles size={12} className="text-indigo-400" />
                  <span className="truncate">{activeQrEvent.title}</span>
                </div>

                {/* Control Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/80">
                  {/* Copy Link Button */}
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="text-indigo-400" />
                        Copiar Link
                      </>
                    )}
                  </button>

                  {/* Print Button */}
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-950/30"
                  >
                    <Printer size={14} />
                    Imprimir QR
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
