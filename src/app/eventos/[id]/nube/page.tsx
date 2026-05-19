"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Sparkles, CheckCircle2, CloudLightning, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function NubeParticipantePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventoId = resolvedParams.id;
  
  const [palabra, setPalabra] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showInstructions, setShowInstructions] = useState(true);

  const supabase = createClient();
  const MAX_CARACTERES = 20;

  useEffect(() => {
    // Comprobar si ya envió una palabra para este evento
    const yaEnviado = localStorage.getItem(`nube_enviada_${eventoId}`);
    if (yaEnviado === "true") {
      setEnviado(true);
    }
  }, [eventoId]);

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
        palabra: palabraLimpia
      });

      if (!error) {
        localStorage.setItem(`nube_enviada_${eventoId}`, "true");
        setEnviado(true);
      } else {
        console.error("Supabase Error:", error);
        setErrorMsg("Hubo un error al enviar tu idea. Intentá de nuevo.");
      }
    } catch (err) {
      console.error("Submission Error:", err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-24 overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-white">
      {/* Fondo estético con gradientes radiales de neón */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/25 via-transparent to-purple-950/25 pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-20%] w-[80%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0" />

      {/* Header Institucional Móvil */}
      <header className="relative border-b border-white/[0.05] bg-slate-950/80 backdrop-blur-xl px-4 py-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image 
              src="/logoitectrans_v2.png" 
              alt="Logo ITEC" 
              width={75} 
              height={25} 
              className="h-6 w-auto object-contain"
              priority
            />
            <div className="w-[1px] h-4 bg-zinc-800" />
            <h1 className="text-xs font-black text-zinc-100 tracking-wide uppercase">
              Nube de Ideas
            </h1>
          </div>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className={`flex items-center justify-center p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
              showInstructions 
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white"
            }`}
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 mt-6 space-y-6">
        <AnimatePresence mode="wait">
          {!enviado ? (
            <motion.div
              key="formulario"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Instrucciones Breves con mucho cuerpo */}
              {showInstructions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3">
                    <button
                      onClick={() => setShowInstructions(false)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.05] cursor-pointer"
                    >
                      Ocultar
                    </button>
                  </div>
                  <h2 className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-400 animate-pulse" /> Nube Colectiva
                  </h2>
                  <p className="text-xs text-zinc-200 font-medium leading-relaxed">
                    Ingresá una palabra que defina tu experiencia hoy. Tu palabra se unirá a la de los demás en la <strong className="text-indigo-300 font-bold">pantalla gigante</strong> en tiempo real. ¡Las palabras más repetidas se verán más grandes!
                  </p>
                </motion.div>
              )}

              {/* Formulario de Entrada */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-5 relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                
                <div className="space-y-2 text-center">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2 border border-indigo-500/20">
                    <CloudLightning size={24} className="animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">¿Qué palabra define el taller de hoy?</h3>
                  <p className="text-xs text-zinc-400">Ingresá tu idea de forma simple y concisa.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
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
                      className="w-full px-4 py-3.5 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-700 focus:outline-none transition-colors text-center text-lg font-extrabold tracking-wide h-[52px]"
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
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-850 disabled:to-zinc-850 disabled:text-zinc-650 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.97] cursor-pointer h-[50px]"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Enviando...</span>
                    ) : (
                      <>
                        <Send size={14} />
                        Enviar Idea
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
                  Tu palabra ha sido unida a la nube en tiempo real. Mirá la pantalla gigante del auditorio para ver cómo va creciendo.
                </p>
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  Idea Registrada
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
