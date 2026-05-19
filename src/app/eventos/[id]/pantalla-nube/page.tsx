"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, CloudLightning, Activity, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface PalabrasConteo {
  [key: string]: number;
}

export default function PantallaNubePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventoId = resolvedParams.id;

  const [palabrasRaw, setPalabrasRaw] = useState<string[]>([]);
  const [palabrasAgrupadas, setPalabrasAgrupadas] = useState<PalabrasConteo>({});
  const [lastAddedWord, setLastAddedWord] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchPalabrasIniciales = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("evento_nube_palabras")
          .select("palabra")
          .eq("evento_id", eventoId);

        if (data && !error) {
          const list = data.map((d: any) => d.palabra);
          setPalabrasRaw(list);
        }
      } catch (err) {
        console.error("Error cargando palabras iniciales:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPalabrasIniciales();

    // Suscripción Realtime
    const nubeSubscription = supabase
      .channel(`public:evento_nube_palabras:${eventoId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "evento_nube_palabras", 
          filter: `evento_id=eq.${eventoId}` 
        },
        (payload) => {
          const nuevaPalabra = payload.new.palabra;
          setPalabrasRaw(prev => [...prev, nuevaPalabra]);
          setLastAddedWord(nuevaPalabra);
          // Ocultar el flash de novedad después de unos segundos
          setTimeout(() => setLastAddedWord(null), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(nubeSubscription);
    };
  }, [eventoId, supabase]);

  // Agrupamiento y Conteo de Repeticiones
  useEffect(() => {
    const conteo: PalabrasConteo = {};
    palabrasRaw.forEach((w) => {
      if (w) {
        conteo[w] = (conteo[w] || 0) + 1;
      }
    });
    setPalabrasAgrupadas(conteo);
  }, [palabrasRaw]);

  // Obtener tamaño de fuente proporcional a los votos
  const getFontSizeClass = (votos: number) => {
    const valoresVotos = Object.values(palabrasAgrupadas);
    const maxVotos = valoresVotos.length > 0 ? Math.max(...valoresVotos) : 1;
    const minVotos = 1;

    if (maxVotos === minVotos) return { fontSize: "1.75rem", className: "text-zinc-400 font-medium" };

    // Escala del 0 al 1
    const factor = (votos - minVotos) / (maxVotos - minVotos);

    // Ajuste de tamaño dinámico
    if (factor > 0.8) {
      return { 
        fontSize: `${2.8 + factor * 2.2}rem`, 
        className: "font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)] z-20" 
      };
    }
    if (factor > 0.5) {
      return { 
        fontSize: `${2.0 + factor * 1.5}rem`, 
        className: "font-extrabold text-indigo-300 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)] z-10" 
      };
    }
    if (factor > 0.2) {
      return { 
        fontSize: `${1.5 + factor * 1.0}rem`, 
        className: "font-bold text-blue-400" 
      };
    }
    return { 
      fontSize: `${1.15 + factor * 0.5}rem`, 
      className: "font-semibold text-zinc-400/80" 
    };
  };

  // Convertimos a array y ordenamos alfabéticamente para evitar reordenamientos caóticos incesantes,
  // permitiendo que las palabras crezcan en su posición fija facilitando el seguimiento del público.
  const palabrasOrdenadas = Object.keys(palabrasAgrupadas).sort();

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 overflow-hidden font-sans flex flex-col relative">
      {/* Background neon glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />

      <div className="max-w-[95rem] mx-auto w-full px-8 py-8 flex flex-col h-screen relative z-10">
        
        {/* Header - Auditorio con Logo ITEC Independiente */}
        <header className="flex items-center justify-between mb-8 shrink-0 border-b border-white/[0.05] pb-6 gap-6">
          {/* Logo ITEC a la izquierda de todo */}
          <div className="relative flex items-center justify-center shrink-0 bg-zinc-900/30 border border-white/[0.05] px-5 py-3 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)]">
            <Image 
              src="/logoitectrans_v2.png" 
              alt="Logo ITEC" 
              width={120} 
              height={36} 
              className="h-8.5 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]"
              priority
            />
          </div>

          {/* Título Central */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-1">
              Nube de Ideas en Vivo
            </h1>
            <p className="text-base text-indigo-300 font-bold tracking-wide">
              ¡Tu opinión en tiempo real! Las palabras más repetidas se ven más grandes
            </p>
          </div>

          {/* Estado de Realtime a la derecha */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800 px-5 py-2.5 rounded-2xl">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-extrabold text-sm tracking-wider uppercase flex items-center gap-1.5">
                <Activity size={14} className="animate-pulse" /> Conectado Realtime
              </span>
            </div>
          </div>
        </header>

        {/* Word Cloud Container */}
        <div className="flex-1 bg-zinc-900/10 border border-white/[0.03] rounded-[3rem] p-10 backdrop-blur-xl relative overflow-hidden flex flex-col justify-center items-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <CloudLightning size={48} className="text-indigo-400 animate-spin" />
              <p className="text-zinc-500 text-sm font-semibold tracking-widest uppercase">Cargando Nube de Ideas...</p>
            </div>
          ) : palabrasOrdenadas.length === 0 ? (
            <div className="text-center space-y-4 max-w-md">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-2">
                <CloudLightning size={32} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-400">Esperando las primeras ideas...</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Escaneá el código QR en pantalla con tu celular e ingresá una palabra para comenzar a proyectar en tiempo real.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 max-w-6xl w-full px-4 py-8">
              <AnimatePresence>
                {palabrasOrdenadas.map((word) => {
                  const votos = palabrasAgrupadas[word];
                  const styleObj = getFontSizeClass(votos);
                  const isNew = word === lastAddedWord;

                  return (
                    <motion.span
                      key={word}
                      layout // Suaviza la recolocación física de las palabras en pantalla
                      initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                      animate={{ 
                        scale: isNew ? [1, 1.35, 1] : 1,
                        opacity: 1
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 120, 
                        damping: 15,
                        scale: { duration: 0.8, times: [0, 0.4, 1] } 
                      }}
                      style={{ fontSize: styleObj.fontSize }}
                      className={`inline-block select-none cursor-default transition-all duration-300 ${styleObj.className} ${
                        isNew ? "relative z-30" : ""
                      }`}
                    >
                      {/* Efecto decorativo opcional para el Top 1 */}
                      {word === Object.keys(palabrasAgrupadas).reduce((a, b) => palabrasAgrupadas[a] > palabrasAgrupadas[b] ? a : b) && votos > 1 && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 pointer-events-none tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                          <Award size={10} /> TOP
                        </span>
                      )}
                      
                      {word}

                      {/* Contador de votos ultra estético flotando */}
                      <span className="ml-2 text-[11px] font-black tracking-normal text-zinc-500/80 bg-zinc-900/50 border border-zinc-800/80 rounded-full px-2 py-0.5 align-middle select-none">
                        {votos}
                      </span>
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
