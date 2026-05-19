"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Sparkles, CheckCircle2, CloudLightning, HelpCircle, ArrowLeft, Loader2, ListCollapse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function NubeParticipantePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventoId = resolvedParams.id;
  
  const [nubeId, setNubeId] = useState<string | null>(null);
  const [nubeNombre, setNubeNombre] = useState<string | null>(null);
  const [loadingNube, setLoadingNube] = useState(true);
  const [eventNubesList, setEventNubesList] = useState<any[]>([]);

  const [palabra, setPalabra] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showInstructions, setShowInstructions] = useState(true);
  const [dispositivoId, setDispositivoId] = useState("");

  const supabase = createClient();
  const MAX_CARACTERES = 20;

  // 1. Leer el nubeId de los parámetros de búsqueda e inicializar dispositivoId
  useEffect(() => {
    if (typeof window !== "undefined") {
      const queryParams = new URLSearchParams(window.location.search);
      const id = queryParams.get("nubeId");
      setNubeId(id);

      // Generar o recuperar identificador único de dispositivo
      let depId = localStorage.getItem("itec_dispositivo_id");
      if (!depId) {
        depId = typeof crypto !== "undefined" && crypto.randomUUID 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("itec_dispositivo_id", depId);
      }
      setDispositivoId(depId);
    }
  }, []);

  // 2. Comprobar si ya envió una palabra para esta nube/evento
  useEffect(() => {
    const key = nubeId ? `nube_enviada_${nubeId}` : `nube_enviada_${eventoId}`;
    const yaEnviado = localStorage.getItem(key);
    if (yaEnviado === "true") {
      setEnviado(true);
    } else {
      setEnviado(false);
    }
  }, [nubeId, eventoId]);

  // 3. Cargar información de la nube o listado general
  useEffect(() => {
    const fetchNubeData = async () => {
      setLoadingNube(true);
      try {
        if (nubeId) {
          // Si hay nubeId, obtenemos su nombre
          const { data, error } = await supabase
            .from("evento_nubes")
            .select("nombre")
            .eq("id", nubeId)
            .single();

          if (data && !error) {
            setNubeNombre(data.nombre);
          } else {
            console.error("Nube no encontrada o error:", error);
            setNubeId(null); // Si falla, volvemos a la lista
          }
        } else {
          // Si no hay nubeId, obtenemos todas las nubes de este evento
          const { data, error } = await supabase
            .from("evento_nubes")
            .select("*")
            .eq("evento_id", eventoId)
            .order("created_at", { ascending: false });

          if (data && !error) {
            setEventNubesList(data);
          }
        }
      } catch (err) {
        console.error("Error al cargar datos de la nube:", err);
      } finally {
        setLoadingNube(false);
      }
    };

    if (eventoId) {
      fetchNubeData();
    }
  }, [nubeId, eventoId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Sanitización exhaustiva para agrupamiento perfecto
    // 1. Convertir a minúsculas y quitar espacios en extremos
    // 2. Normalizar diacríticos (remover tildes/acentos) para agrupar "Innovación", "innovacion" e "INNOVACIÓN" como "innovacion"
    const palabraLimpia = palabra
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!palabraLimpia) {
      setErrorMsg("Por favor, ingresá una palabra válida.");
      return;
    }

    if (palabraLimpia.includes(" ")) {
      setErrorMsg("Ingresá una sola palabra (sin espacios).");
      return;
    }

    if (palabraLimpia.length > MAX_CARACTERES) {
      setErrorMsg(`La palabra no puede superar los ${MAX_CARACTERES} caracteres.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("evento_nube_palabras").insert({
        evento_id: eventoId,
        nube_id: nubeId || null,
        palabra: palabraLimpia,
        dispositivo_id: dispositivoId || null
      });

      if (!error) {
        const key = nubeId ? `nube_enviada_${nubeId}` : `nube_enviada_${eventoId}`;
        localStorage.setItem(key, "true");
        setEnviado(true);
      } else {
        console.error("Supabase Error:", error);
        if (error.code === "23505") {
          // Ya envió desde este dispositivo
          const key = nubeId ? `nube_enviada_${nubeId}` : `nube_enviada_${eventoId}`;
          localStorage.setItem(key, "true");
          setEnviado(true);
        } else {
          setErrorMsg("Hubo un error al enviar tu idea. Intentá de nuevo.");
        }
      }
    } catch (err) {
      console.error("Submission Error:", err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectNube = (id: string, nombre: string) => {
    setNubeId(id);
    setNubeNombre(nombre);
    // Cambiar URL en el historial del navegador sin recargar para mantener el estado limpio
    if (typeof window !== "undefined") {
      const newUrl = `${window.location.pathname}?nubeId=${id}`;
      window.history.pushState({ path: newUrl }, "", newUrl);
    }
  };

  const handleGoBack = () => {
    setNubeId(null);
    setNubeNombre(null);
    setEnviado(false);
    setPalabra("");
    if (typeof window !== "undefined") {
      const newUrl = window.location.pathname;
      window.history.pushState({ path: newUrl }, "", newUrl);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-24 overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-white">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-20%] w-[80%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0" />

      {/* Premium Header */}
      <header className="relative border-b border-white/[0.05] bg-slate-950/80 backdrop-blur-xl px-4 py-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image 
              src="/logoitectrans_v2.png" 
              alt="Logo ITEC" 
              width={65} 
              height={22} 
              className="h-5.5 w-auto object-contain"
              priority
            />
            <div className="w-[1px] h-3 bg-zinc-800" />
            <span className="text-[10px] font-black text-purple-400 tracking-widest uppercase">
              NUBE
            </span>
          </div>
          <div className="flex items-center gap-2">
            {nubeId && (
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="Volver a la lista de nubes"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`flex items-center justify-center p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                showInstructions 
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400" 
                  : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white"
              }`}
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 mt-5 space-y-5">
        {loadingNube ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 size={36} className="text-purple-400 animate-spin" />
            <p className="text-sm text-zinc-400 font-extrabold tracking-widest uppercase">Cargando actividad...</p>
          </div>
        ) : !nubeId ? (
          /* PANTALLA: SELECCIÓN DE NUBE (cuando no se especifica nubeId en URL) */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="bg-gradient-to-br from-purple-950/40 to-slate-900/40 border border-purple-500/20 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
              <h2 className="text-xs font-extrabold text-purple-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400" /> Nube Colectiva
              </h2>
              <p className="text-xs text-zinc-200 font-medium leading-relaxed">
                ¡Bienvenido! Seleccioná una de las nubes de ideas creadas por el organizador para enviar tu palabra. Las palabras más repetidas se verán más grandes en la pantalla gigante del auditorio.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 backdrop-blur-sm shadow-xl space-y-4">
              <div className="space-y-1 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2 border border-purple-500/20">
                  <ListCollapse size={24} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Actividades Disponibles</h3>
                <p className="text-xs text-zinc-400">Seleccioná una nube de ideas para participar:</p>
              </div>

              <div className="space-y-2.5 pt-1">
                {eventNubesList.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs font-semibold leading-relaxed border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
                    <CloudLightning size={24} className="mx-auto text-zinc-700 mb-2 animate-pulse" />
                    Esperando que el organizador inicie una nube...
                  </div>
                ) : (
                  eventNubesList.map((nube) => {
                    const yaEnviada = localStorage.getItem(`nube_enviada_${nube.id}`) === "true";
                    return (
                      <button
                        key={nube.id}
                        onClick={() => handleSelectNube(nube.id, nube.nombre)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left active:scale-[0.98] cursor-pointer ${
                          yaEnviada
                            ? "bg-emerald-950/15 hover:bg-emerald-950/25 border-emerald-500/20 text-zinc-300"
                            : "bg-zinc-950/50 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 text-white"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-sm font-extrabold tracking-wide block truncate">{nube.nombre}</span>
                          <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">
                            {yaEnviada ? "✓ Ya participaste" : "Hacé clic para enviar palabra"}
                          </span>
                        </div>
                        {yaEnviada ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider shrink-0">
                            Enviado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-black uppercase tracking-wider shrink-0">
                            Entrar
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* PANTALLA: FORMULARIO O AGRADECIMIENTO (cuando nubeId está cargado) */
          <AnimatePresence mode="wait">
            {!enviado ? (
              <motion.div
                key="formulario"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                {/* Dynamic Premium Instructions */}
                {showInstructions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-br from-purple-950/40 to-slate-900/40 border border-purple-500/20 rounded-3xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3">
                      <button
                        onClick={() => setShowInstructions(false)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.05] cursor-pointer"
                      >
                        Ocultar
                      </button>
                    </div>
                    <h2 className="text-xs font-extrabold text-purple-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-purple-400 animate-pulse" /> ¿Cómo funciona?
                    </h2>
                    <ul className="space-y-3.5 text-xs text-zinc-200">
                      <li className="flex gap-2.5">
                        <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-black text-[10px]">1</span>
                        <span className="font-medium leading-relaxed">
                          <strong className="text-white font-black">Pensá tu palabra:</strong> Escribí una idea o concepto corto que represente tu opinión (máximo 20 letras, sin espacios).
                        </span>
                      </li>
                      <li className="flex gap-2.5">
                        <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-black text-[10px]">2</span>
                        <span className="font-medium leading-relaxed">
                          <strong className="text-white font-black">Sumá tu voto:</strong> Tu palabra aparecerá en la <strong className="text-purple-400 font-bold">pantalla gigante</strong> en tiempo real. ¡Si otros la repiten, se verá más grande!
                        </span>
                      </li>
                      <li className="flex gap-2.5">
                        <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-black text-[10px]">3</span>
                        <span className="font-medium leading-relaxed">
                          <strong className="text-white font-black">Una por persona:</strong> Podés enviar solo una palabra por actividad desde tu celular, ¡pensá bien tu aporte!
                        </span>
                      </li>
                    </ul>
                  </motion.div>
                )}
 
                {/* Premium Form Card - 100% Touch Friendly */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 backdrop-blur-sm shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                  
                  <div className="space-y-2 text-center">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2 border border-purple-500/20">
                      <CloudLightning size={24} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {nubeNombre || "¿Qué opinás?"}
                    </h3>
                    <p className="text-xs text-zinc-400">Ingresá tu palabra (una sola palabra, sin espacios).</p>
                  </div>
 
                  <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Tu Palabra</label>
                        <span className={`text-[10px] font-extrabold ${palabra.length >= MAX_CARACTERES ? 'text-rose-400 animate-pulse' : 'text-zinc-500'}`}>
                          {palabra.length} / {MAX_CARACTERES}
                        </span>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Ej. innovacion"
                        required
                        maxLength={MAX_CARACTERES}
                        value={palabra}
                        onChange={(e) => {
                          // Impedir espacios para forzar una sola palabra
                          const val = e.target.value.replace(/\s/g, "");
                          setPalabra(val);
                        }}
                        autoCapitalize="none"
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700/80 focus:border-purple-500/50 rounded-2xl text-white placeholder-zinc-700 focus:outline-none transition-colors text-center text-lg font-extrabold tracking-wide h-[48px]"
                      />
                    </div>
 
                    {errorMsg && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-rose-400 text-center font-bold"
                      >
                        {errorMsg}
                      </motion.p>
                    )}
 
                    <button
                      type="submit"
                      disabled={isSubmitting || !palabra.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-850 disabled:to-zinc-850 disabled:text-zinc-600 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.97] cursor-pointer h-[50px]"
                    >
                      {isSubmitting ? (
                        <span className="animate-pulse">Enviando palabra...</span>
                      ) : (
                        <>
                          <Send size={14} />
                          Enviar Idea en Vivo
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="agradecimiento"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl text-center space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                  >
                    <CheckCircle2 size={36} className="animate-pulse" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white tracking-tight">¡Muchas gracias por participar!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    Tu palabra ha sido unida a la nube <span className="text-purple-400 font-bold">"{nubeNombre}"</span> en tiempo real. Mirá la pantalla gigante del auditorio para ver cómo va creciendo.
                  </p>
                </div>

                <div className="pt-2 flex flex-col items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                    Idea Registrada
                  </div>
                  
                  <button
                    onClick={handleGoBack}
                    className="text-xs font-extrabold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider mt-4 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={12} /> Ver otras actividades
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
