"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThumbsUp, QrCode, Sparkles, Smartphone, Award, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import Image from "next/image";

interface Pregunta {
  id: string;
  nombre: string;
  pregunta: string;
  likes: number;
  created_at: string;
}

export default function PantallaPreguntasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventoId = resolvedParams.id;
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [qrUrl, setQrUrl] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/eventos/${eventoId}/preguntar`);
    }

    const fetchPreguntas = async () => {
      const { data, error } = await supabase
        .from("evento_preguntas")
        .select(`
          id,
          nombre,
          pregunta,
          created_at,
          evento_preguntas_likes(count)
        `)
        .eq("evento_id", eventoId)
        .eq("aprobada", true);

      if (data && !error) {
        const formatted = data.map((q: any) => ({
          id: q.id,
          nombre: q.nombre || "Anónimo",
          pregunta: q.pregunta,
          created_at: q.created_at,
          likes: q.evento_preguntas_likes?.[0]?.count || 0
        }));
        
        formatted.sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPreguntas(formatted);
      }
    };

    fetchPreguntas();

    const questionsSubscription = supabase
      .channel("public:evento_preguntas:pantalla")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "evento_preguntas", filter: `evento_id=eq.${eventoId}` },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new.aprobada) {
            setPreguntas(prev => {
              const newQ = {
                id: payload.new.id,
                nombre: payload.new.nombre || "Anónimo",
                pregunta: payload.new.pregunta,
                likes: 0,
                created_at: payload.new.created_at
              };
              return [...prev, newQ].sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            });
          } else if (payload.eventType === "UPDATE") {
            if (payload.new.aprobada) {
              setPreguntas(prev => {
                const exists = prev.find(p => p.id === payload.new.id);
                if (exists) return prev;
                const newQ = {
                  id: payload.new.id,
                  nombre: payload.new.nombre || "Anónimo",
                  pregunta: payload.new.pregunta,
                  likes: 0,
                  created_at: payload.new.created_at
                };
                return [...prev, newQ].sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              });
            } else {
              setPreguntas(prev => prev.filter(p => p.id !== payload.old.id));
            }
          } else if (payload.eventType === "DELETE") {
            setPreguntas(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const likesSubscription = supabase
      .channel("public:evento_preguntas_likes:pantalla")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "evento_preguntas_likes" },
        (payload) => {
          setPreguntas(prev => {
            const updated = prev.map(p => {
              if (p.id === payload.new.pregunta_id) {
                return { ...p, likes: p.likes + 1 };
              }
              return p;
            });
            return updated.sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(questionsSubscription);
      supabase.removeChannel(likesSubscription);
    };
  }, [eventoId, supabase]);

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 overflow-hidden font-sans flex flex-col relative">
      {/* Background neon glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />

      <div className="max-w-[95rem] mx-auto w-full px-8 py-8 flex flex-col h-screen relative z-10">
        
        {/* Header - Auditorio */}
        <header className="flex items-center justify-between mb-8 shrink-0 border-b border-white/[0.05] pb-6">
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center shrink-0 bg-zinc-900/30 border border-white/[0.05] px-5 py-3 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)]">
              <Image 
                src="/logoitectrans_v2.png" 
                alt="Logo ITEC" 
                width={130} 
                height={40} 
                className="h-9 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                priority
              />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-1.5">
                Preguntas al Orador
              </h1>
              <p className="text-lg text-indigo-300 font-bold tracking-wide">
                ¡Tu opinión importa! Hacé tus consultas en vivo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800 px-5 py-2.5 rounded-2xl">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-extrabold text-sm tracking-wider uppercase">Moderación Activa</span>
            </div>
          </div>
        </header>

        {/* Main Workspace Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
          
          {/* Left Column: Questions List (takes 2 cols) */}
          <div className="lg:col-span-2 flex flex-col min-h-0 bg-zinc-900/10 border border-white/[0.03] rounded-[2.5rem] p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6 shrink-0 px-2">
              <h2 className="text-xl font-extrabold text-zinc-300 tracking-wider flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={20} /> Ranking de Preguntas
              </h2>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.05]">
                {preguntas.length} {preguntas.length === 1 ? 'Pregunta' : 'Preguntas'}
              </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar pb-6">
              <AnimatePresence mode="popLayout">
                {preguntas.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 0.5 }}
                    className="h-full flex flex-col items-center justify-center text-center py-20"
                  >
                    <MessageCircle className="w-24 h-24 mb-6 text-slate-600 animate-bounce" />
                    <h2 className="text-2xl font-bold text-slate-400">Esperando las primeras preguntas...</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-md">¡Escaneá el código QR de la derecha para inaugurar el muro!</p>
                  </motion.div>
                ) : (
                  preguntas.map((q, idx) => (
                    <motion.div
                      key={q.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 100, damping: 15 }}
                      className={`relative border rounded-3xl p-6 shadow-xl flex gap-6 items-center overflow-hidden transition-all ${
                        idx === 0
                          ? "bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border-indigo-500/40 shadow-indigo-950/20"
                          : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/50"
                      }`}
                    >
                      {/* Top 1 Indicator badge decoration */}
                      {idx === 0 && (
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-400 via-indigo-600 to-purple-600" />
                      )}

                      {/* Rank Position */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-20">
                        <div className={`text-4xl lg:text-5xl font-black tracking-tighter mb-2 ${
                          idx === 0 
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500' 
                            : 'text-slate-500'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-extrabold text-sm ${
                          idx === 0 
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                            : 'bg-zinc-950/60 text-slate-400'
                        }`}>
                          <ThumbsUp className={`w-4 h-4 ${idx === 0 ? 'fill-indigo-400' : 'fill-slate-500'}`} />
                          <span className="text-lg">{q.likes}</span>
                        </div>
                      </div>
                      
                      {/* Question Content */}
                      <div className="flex-1 space-y-4">
                        <p className={`text-2xl lg:text-3xl font-extrabold leading-snug tracking-wide ${
                          idx === 0 ? 'text-white' : 'text-slate-200'
                        }`}>
                          "{q.pregunta}"
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="bg-zinc-950/60 text-zinc-400 border border-zinc-800 font-extrabold px-4 py-1 rounded-full text-xs uppercase tracking-widest flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                            {q.nombre}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/20 flex items-center gap-1">
                              <Award size={12} /> Pregunta Destacada
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Dynamic Instruction & QR Scanner Sidebar (1 col) */}
          <div className="flex flex-col items-center justify-center bg-zinc-900/30 border border-white/[0.04] rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl shrink-0 gap-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] pointer-events-none" />
            
            <div className="w-full text-center">
              <h3 className="text-2xl font-black uppercase tracking-widest text-indigo-300 flex items-center justify-center gap-3">
                <Smartphone size={24} className="animate-pulse" /> Participá Ahora
              </h3>
            </div>

            {/* QR Card Container */}
            <div className="flex flex-col items-center justify-center">
              {qrUrl ? (
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-45 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt animate-pulse"></div>
                  <div className="relative bg-white p-6 rounded-[2.5rem] shadow-[0_0_60px_rgba(99,102,241,0.35)] border-4 border-slate-950 inline-block">
                    <QRCode
                      value={qrUrl}
                      size={265}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-64 h-64 rounded-[2.5rem] bg-zinc-850 animate-pulse border border-zinc-800 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-zinc-600 animate-spin" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </div>
  );
}
