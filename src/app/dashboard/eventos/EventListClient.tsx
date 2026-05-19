"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Tv, UserPlus, ShieldAlert, QrCode, Copy, Check, Printer, X, Sparkles, Trash2, Plus, Loader2, ExternalLink, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import type { ItecAction } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export default function EventListClient({ initialActions, mode = 'preguntas' }: { initialActions: ItecAction[], mode?: 'preguntas' | 'nubes' }) {
  const [actions] = useState<ItecAction[]>(initialActions);
  const [activeQrEvent, setActiveQrEvent] = useState<ItecAction | null>(null);
  const [activeQrCloud, setActiveQrCloud] = useState<{ id: string, name: string, eventoId: string, eventTitle: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  // Estados para la gestión de nubes múltiples por evento
  const [managingNubeEvent, setManagingNubeEvent] = useState<ItecAction | null>(null);
  const [nubes, setNubes] = useState<any[]>([]);
  const [newNubeName, setNewNubeName] = useState("");
  const [isCreatingNube, setIsCreatingNube] = useState(false);
  const [isLoadingNubes, setIsLoadingNubes] = useState(false);

  useEffect(() => {
    if (activeQrEvent && typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/eventos/${activeQrEvent.id}/preguntar`);
    } else if (activeQrCloud && typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/eventos/${activeQrCloud.eventoId}/nube?nubeId=${activeQrCloud.id}`);
    } else {
      setQrUrl("");
    }
  }, [activeQrEvent, activeQrCloud]);

  // Cargar las nubes cuando se selecciona un evento para gestionar
  useEffect(() => {
    if (managingNubeEvent) {
      const fetchNubes = async () => {
        setIsLoadingNubes(true);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("evento_nubes")
            .select("*")
            .eq("evento_id", managingNubeEvent.id)
            .order("created_at", { ascending: false });
          if (data && !error) {
            setNubes(data);
          }
        } catch (err) {
          console.error("Error al cargar nubes:", err);
        } finally {
          setIsLoadingNubes(false);
        }
      };
      fetchNubes();
    } else {
      setNubes([]);
    }
  }, [managingNubeEvent]);

  const handleCreateNube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNubeName.trim() || !managingNubeEvent) return;
    setIsCreatingNube(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("evento_nubes")
        .insert({
          evento_id: managingNubeEvent.id,
          nombre: newNubeName.trim()
        })
        .select()
        .single();

      if (data && !error) {
        setNubes(prev => [data, ...prev]);
        setNewNubeName("");
      } else {
        console.error("Error al crear la nube:", error);
      }
    } catch (err) {
      console.error("Error al crear la nube:", err);
    } finally {
      setIsCreatingNube(false);
    }
  };

  const handleDeleteNube = async (nubeId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta nube de ideas? Se borrarán de forma permanente todas las palabras asociadas a ella.")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("evento_nubes")
        .delete()
        .eq("id", nubeId);

      if (!error) {
        setNubes(prev => prev.filter(n => n.id !== nubeId));
      } else {
        console.error("Error al eliminar la nube:", error);
      }
    } catch (err) {
      console.error("Error al eliminar la nube:", err);
    }
  };

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
    const title = activeQrEvent ? "Preguntas en Vivo" : `Nube de Ideas: ${activeQrCloud?.name}`;
    const desc = activeQrEvent 
      ? "Escaneá con tu celular para enviar preguntas y votar otras consultas del evento"
      : "Escaneá con tu celular para enviar tu palabra y sumarte a la nube de ideas en vivo";
    const footerText = activeQrEvent ? activeQrEvent.title : `${activeQrCloud?.eventTitle} - ${activeQrCloud?.name}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - Código QR</title>
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
            <h1>${title}</h1>
            <p>${desc}</p>
            <div class="qr-wrapper">
              <svg width="250" height="250" viewBox="0 0 256 256">
                ${document.getElementById("qr-code-svg")?.innerHTML || ""}
              </svg>
            </div>
            <div class="footer">${footerText} - ITEC</div>
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

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const innerSvg = svg.cloneNode(true) as SVGElement;
    innerSvg.removeAttribute("style");
    innerSvg.removeAttribute("id");
    innerSvg.setAttribute("width", "100%");
    innerSvg.setAttribute("height", "100%");

    const innerSvgData = new XMLSerializer().serializeToString(innerSvg);

    const title = activeQrEvent ? "Preguntas al Orador" : `Nube de Ideas: ${activeQrCloud?.name}`;
    const subtitle = activeQrEvent ? activeQrEvent.title : `${activeQrCloud?.eventTitle}`;

    const wrapperSvgData = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500" style="background-color: #ffffff; font-family: system-ui, -apple-system, sans-serif;">
        <rect width="400" height="500" fill="#ffffff" />
        <text x="200" y="45" text-anchor="middle" font-size="20" font-weight="bold" fill="#0f172a">${title}</text>
        <text x="200" y="70" text-anchor="middle" font-size="12" font-weight="600" fill="#64748b">${subtitle}</text>
        <g transform="translate(75, 110)">
          <svg width="250" height="250" viewBox="0 0 256 256">
            ${innerSvgData}
          </svg>
        </g>
        <rect x="0" y="440" width="400" height="60" fill="#f8fafc" />
        <line x1="0" y1="440" x2="400" y2="440" stroke="#e2e8f0" stroke-width="1" />
        <text x="200" y="475" text-anchor="middle" font-size="12" font-weight="bold" fill="#17338c" letter-spacing="1">ITEC EVENTOS</text>
      </svg>
    `.trim();

    const blob = new Blob([wrapperSvgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement("a");
    const filename = activeQrEvent 
      ? `QR_Preguntas_${activeQrEvent.title.substring(0, 15).replace(/[^a-z0-9]/gi, '_')}`
      : `QR_Nube_${activeQrCloud?.name.substring(0, 15).replace(/[^a-z0-9]/gi, '_')}`;
    
    downloadLink.href = url;
    downloadLink.download = `${filename}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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
                  ? mode === 'nubes'
                    ? 'border-purple-500/30 bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-purple-950/20'
                    : 'border-indigo-500/30 bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-indigo-950/20'
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
                {/* Sección: Preguntas en Vivo (Q&A) - solo en modo preguntas */}
                {mode === 'preguntas' && (
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
                )}

                {/* Sección: Nube de Ideas - solo en modo nubes */}
                {mode === 'nubes' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] uppercase font-black tracking-widest text-purple-400 flex items-center gap-1">
                        <Sparkles size={9} /> Nube de Ideas
                      </span>
                    </div>
                    <button
                      onClick={() => setManagingNubeEvent(action)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-white text-[11px] font-extrabold tracking-wider uppercase transition-all shadow-md active:scale-[0.98] cursor-pointer h-[40px]"
                    >
                      <Sparkles size={12} className="animate-pulse text-purple-400" />
                      Gestionar Nubes
                    </button>
                  </div>
                )}
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
        {(activeQrEvent || activeQrCloud) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setActiveQrEvent(null); setActiveQrCloud(null); }}
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
                onClick={() => { setActiveQrEvent(null); setActiveQrCloud(null); }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-zinc-400 hover:text-white transition-all hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <QrCode size={24} />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {activeQrEvent ? "Código QR del Asistente" : `QR de la Nube: ${activeQrCloud?.name}`}
                  </h3>
                  <p className="text-xs text-zinc-400 px-4 leading-relaxed">
                    {activeQrEvent 
                      ? "Mostrá o imprimí este código QR para que la audiencia pueda escanearlo y enviar preguntas desde sus teléfonos."
                      : "Mostrá o imprimí este código QR para que la audiencia pueda escanearlo y enviar palabras a esta nube en tiempo real."
                    }
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
                  <span className="truncate">
                    {activeQrEvent ? activeQrEvent.title : `${activeQrCloud?.eventTitle} — ${activeQrCloud?.name}`}
                  </span>
                </div>

                {/* Control Actions */}
                <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-zinc-800/80">
                  {/* Copy Link Button */}
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-[11px] font-extrabold uppercase tracking-wide transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-400 shrink-0" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-indigo-400 shrink-0" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {/* Print Button */}
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-[11px] font-extrabold uppercase tracking-wide transition-all cursor-pointer"
                  >
                    <Printer size={13} className="text-blue-400 shrink-0" />
                    <span>Imprimir</span>
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-extrabold uppercase tracking-wide transition-all cursor-pointer shadow-lg shadow-indigo-950/30"
                  >
                    <Download size={13} className="shrink-0" />
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Gestión de Nubes (Multi-nube) */}
      <AnimatePresence>
        {managingNubeEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManagingNubeEvent(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 max-w-2xl w-full shadow-2xl overflow-hidden backdrop-blur-xl max-h-[85vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={() => setManagingNubeEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-zinc-400 hover:text-white transition-all hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col h-full space-y-4">
                {/* Header */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-extrabold uppercase tracking-wider mb-2">
                    <Sparkles size={11} className="animate-pulse" /> Nube de Ideas
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">
                    Gestionar Nubes de Ideas
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Evento: <span className="text-purple-300 font-semibold">{managingNubeEvent.title}</span>
                  </p>
                </div>

                {/* Formulario de creación */}
                <form onSubmit={handleCreateNube} className="flex gap-2 pt-2 border-t border-zinc-800/80">
                  <input
                    type="text"
                    required
                    placeholder="Ej. Expectativas, Feedback del Taller, Futuro..."
                    value={newNubeName}
                    onChange={(e) => setNewNubeName(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-750 focus:border-purple-500/50 rounded-xl text-white placeholder-zinc-700 focus:outline-none transition-colors text-sm font-semibold h-[42px]"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingNube || !newNubeName.trim()}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-850 disabled:text-zinc-600 text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer h-[42px] shrink-0"
                  >
                    {isCreatingNube ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    Generar Nube
                  </button>
                </form>

                {/* Lista de Nubes */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pt-2 min-h-[250px]">
                  {isLoadingNubes ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <Loader2 size={24} className="text-purple-400 animate-spin" />
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Cargando Nubes...</p>
                    </div>
                  ) : nubes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 px-4">
                      <Sparkles size={24} className="text-zinc-700 mb-2" />
                      <h4 className="text-sm font-bold text-zinc-400">No hay nubes creadas</h4>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                        Ingresá un nombre arriba y hacé clic en "Generar Nube" para crear tu primera nube de ideas dinámica.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {nubes.map((nube) => (
                        <div
                          key={nube.id}
                          className="flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-800 rounded-2xl transition-all gap-4"
                        >
                          {/* Info de la Nube */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white truncate">{nube.nombre}</h4>
                            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                              Creado: {new Date(nube.created_at).toLocaleDateString('es-AR')} {new Date(nube.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* QR Code button */}
                            <button
                              onClick={() => {
                                setActiveQrCloud({
                                  id: nube.id,
                                  name: nube.nombre,
                                  eventoId: managingNubeEvent.id,
                                  eventTitle: managingNubeEvent.title
                                });
                              }}
                              className="flex items-center justify-center gap-1 p-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                              title="Mostrar código QR de participación"
                            >
                              <QrCode size={13} />
                              <span>QR</span>
                            </button>

                            {/* Proyector button (en nueva pestaña) */}
                            <a
                              href={`/eventos/${managingNubeEvent.id}/pantalla-nube?nubeId=${nube.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 p-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                              title="Ver pantalla de la nube (nueva pestaña)"
                            >
                              <Tv size={13} />
                              <span>Proyector</span>
                            </a>

                            {/* Eliminar button */}
                            <button
                              onClick={() => handleDeleteNube(nube.id)}
                              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-950 text-rose-500 hover:text-rose-400 transition-all cursor-pointer"
                              title="Eliminar esta nube"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
