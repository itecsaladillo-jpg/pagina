"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, 
  Calendar, 
  Link2, 
  Copy, 
  Trash2, 
  Play, 
  Eye, 
  Check, 
  AlertTriangle,
  X,
  ExternalLink
} from "lucide-react";

interface Evento {
  id: string;
  nombre_evento: string;
  fecha: string;
  slug_qr: string;
  estado_activo: boolean;
  modalidad: "presencial" | "virtual";
  herramienta_activa: string;
  created_at: string;
}

export default function EventosPresencialesClient({ initialEventos }: { initialEventos: Evento[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [eventos, setEventos] = useState<Evento[]>(initialEventos);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Estados del Formulario
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [slugQr, setSlugQr] = useState("");
  const [modalidad, setModalidad] = useState<"presencial" | "virtual">("presencial");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCopyLink = (slug: string, id: string) => {
    const siteUrl = window.location.origin;
    const fullUrl = `${siteUrl}/eventos/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadQR = async (slug: string, id: string) => {
    setDownloadingId(id);
    try {
      const siteUrl = window.location.origin;
      const fullUrl = `${siteUrl}/eventos/${slug}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(fullUrl)}`;
      
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `qr_${slug}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Error al descargar el QR:", err);
      alert("No se pudo descargar el código QR. Intentá de nuevo.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleEstado = async (id: string, currentStatus: boolean) => {
    const { error: patchError } = await supabase
      .from("eventos")
      .update({ estado_activo: !currentStatus })
      .eq("id", id);

    if (!patchError) {
      setEventos(prev =>
        prev.map(e => (e.id === id ? { ...e, estado_activo: !currentStatus } : e))
      );
    } else {
      alert("Error al actualizar el estado del evento.");
    }
  };

  const handleDeleteEvento = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento y toda su interactividad asociada (votos, preguntas, palabras)? Esta acción es irreversible.")) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("eventos")
      .delete()
      .eq("id", id);

    if (!deleteError) {
      setEventos(prev => prev.filter(e => e.id !== id));
    } else {
      alert("Error al eliminar el evento.");
    }
  };

  const handleCreateEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !slugQr.trim() || !fecha) {
      setError("Completá todos los campos obligatorios.");
      return;
    }

    // Limpiar slug para URL amigable
    const cleanSlug = slugQr
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    if (!cleanSlug) {
      setError("El slug ingresado no es válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("eventos")
        .insert({
          nombre_evento: nombre.trim(),
          slug_qr: cleanSlug,
          fecha: new Date(fecha).toISOString(),
          estado_activo: true,
          modalidad: modalidad,
          herramienta_activa: "encuestas"
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          setError("El slug del QR ya está en uso por otro evento. Elegí uno diferente.");
        } else {
          setError(insertError.message || "Error al insertar el evento en la base de datos.");
        }
      } else if (data) {
        setEventos(prev => [data as Evento, ...prev]);
        setShowModal(false);
        setNombre("");
        setFecha("");
        setSlugQr("");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // Autogenerar sugerencia de slug al escribir el nombre
  const handleNombreChange = (val: string) => {
    setNombre(val);
    const suggested = val
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");
    setSlugQr(suggested);
  };

  return (
    <div className="space-y-6">
      {/* Botón de Acción Principal */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">
          Lista de Eventos Registrados
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          Crear Evento
        </button>
      </div>

      {/* Listado de Eventos */}
      {eventos.length === 0 ? (
        <div className="text-center py-16 px-6 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl space-y-4">
          <Calendar size={48} className="mx-auto text-zinc-700 animate-pulse" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-400">No hay eventos registrados</p>
            <p className="text-xs text-zinc-650 max-w-sm mx-auto">
              Presioná el botón superior para crear tu primer evento presencial o virtual con QR único.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map((ev) => {
            const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
            const eventUrl = `${siteUrl}/eventos/${ev.slug_qr}`;
            
            return (
              <div 
                key={ev.id}
                className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 hover:border-indigo-500/30 transition-all flex flex-col justify-between relative group overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />

                <div className="space-y-4">
                  {/* Cabecera de la Tarjeta */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-2 py-0.5 rounded">
                          QR Único
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          ev.modalidad === 'virtual'
                            ? "text-cyan-400 bg-cyan-950/40 border-cyan-900/50"
                            : "text-amber-400 bg-amber-950/40 border-amber-900/50"
                        }`}>
                          {ev.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-white leading-tight line-clamp-2 pt-1">
                        {ev.nombre_evento}
                      </h4>
                    </div>

                    {/* Switch de Estado Activo */}
                    <button
                      onClick={() => handleToggleEstado(ev.id, ev.estado_activo)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out outline-none ${
                        ev.estado_activo ? "bg-indigo-600" : "bg-zinc-800"
                      }`}
                      title={ev.estado_activo ? "Desactivar evento" : "Activar evento"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out ${
                          ev.estado_activo ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Detalles del Evento */}
                  <div className="space-y-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-zinc-550" />
                      <span>{new Date(ev.fecha).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link2 size={13} className="text-zinc-550 shrink-0" />
                      <a 
                        href={eventUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 font-extrabold tracking-wide hover:underline inline-flex items-center gap-1.5 break-all text-[11px]"
                      >
                        /eventos/{ev.slug_qr}
                        <ExternalLink size={10} />
                      </a>
                    </div>

                    <button
                      onClick={() => handleDownloadQR(ev.slug_qr, ev.id)}
                      disabled={downloadingId === ev.id}
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer mt-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 px-2.5 py-1.5 rounded-xl w-fit"
                    >
                      {downloadingId === ev.id ? (
                        <span className="animate-pulse">Descargando...</span>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Descargar Código QR
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="flex gap-2.5 mt-5 border-t border-zinc-900 pt-4">
                  {/* Botón de Enlace Copiar */}
                  <button
                    onClick={() => handleCopyLink(ev.slug_qr, ev.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      copiedId === ev.id
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    {copiedId === ev.id ? (
                      <>
                        <Check size={12} />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copiar Enlace
                      </>
                    )}
                  </button>

                  {/* Botón Panel del Disertante */}
                  <button
                    onClick={() => router.push(`/dashboard/eventos-presenciales/${ev.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 px-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow transition-all active:scale-[0.97] cursor-pointer"
                  >
                    <Play size={11} className="fill-white" />
                    Panel Vivo
                  </button>

                  {/* Botón Eliminar */}
                  <button
                    onClick={() => handleDeleteEvento(ev.id)}
                    className="p-3.5 bg-zinc-950/40 hover:bg-rose-500/10 border border-zinc-850 hover:border-rose-500/20 text-zinc-500 hover:text-rose-400 rounded-2xl transition-all cursor-pointer"
                    title="Eliminar Evento"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CREACIÓN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-850 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => { setShowModal(false); setError(""); }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Crear Nuevo Evento
              </h3>
              <p className="text-xs text-zinc-500">
                Define los datos del evento presencial o virtual para habilitar tu código QR e interactividad en vivo.
              </p>
            </div>

            <form onSubmit={handleCreateEvento} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Selector de Modalidad */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                  Modalidad del Evento
                </label>
                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setModalidad("presencial")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      modalidad === "presencial"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Presencial
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidad("virtual")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      modalidad === "virtual"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Virtual
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                  Nombre del Evento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Charla de Ciberseguridad ITEC"
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-650 focus:outline-none transition-colors text-sm h-[48px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                  Slug URL del QR (ej: charla-ciber-2026)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs text-zinc-600 font-extrabold select-none">
                    /eventos/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="mi-charla-2026"
                    value={slugQr}
                    onChange={(e) => setSlugQr(e.target.value)}
                    className="w-full pl-[72px] pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-650 focus:outline-none transition-colors text-sm h-[48px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                  Fecha y Hora del Evento
                </label>
                <input
                  type="datetime-local"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white focus:outline-none transition-colors text-sm h-[48px] calendar-dark-scheme"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-900 disabled:to-zinc-900 disabled:text-zinc-600 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.97] cursor-pointer h-[50px] mt-3"
              >
                {loading ? (
                  <span className="animate-pulse">Insertando Evento...</span>
                ) : (
                  <>
                    <Plus size={16} />
                    Crear Evento en Base
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
