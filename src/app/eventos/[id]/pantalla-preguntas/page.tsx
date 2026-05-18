"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThumbsUp, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Pregunta {
  id: string;
  nombre: string;
  pregunta: string;
  likes: number;
  created_at: string;
}

export default function PantallaPreguntasPage({ params }: { params: { id: string } }) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const supabase = createClient();
  const eventoId = params.id;

  useEffect(() => {
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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans flex flex-col">
      <div className="max-w-[90rem] mx-auto w-full px-8 py-10 flex flex-col h-screen">
        {/* Header - Auditorio */}
        <div className="flex items-center justify-between mb-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-500 p-4 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.4)]">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-2">
                Preguntas en Vivo
              </h1>
              <p className="text-2xl text-indigo-300 font-medium">
                Participá desde tu celular
              </p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="text-slate-400 font-bold tracking-widest uppercase text-sm mb-3">Evento Activo</div>
             <div className="flex items-center gap-4 bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700/50">
               <span className="relative flex h-5 w-5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
               </span>
               <span className="text-emerald-400 font-bold text-2xl tracking-wide">Transmitiendo</span>
             </div>
          </div>
        </div>

        {/* Listado de Preguntas */}
        <div className="flex-1 overflow-y-auto pr-6 space-y-6 pb-12 custom-scrollbar">
          <AnimatePresence>
            {preguntas.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center opacity-40 mt-20"
              >
                <MessageCircle className="w-32 h-32 mb-8 text-slate-500" />
                <h2 className="text-4xl font-semibold text-slate-300">Esperando preguntas de la audiencia...</h2>
              </motion.div>
            ) : (
              preguntas.map((q, idx) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                  className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-[2rem] p-8 shadow-2xl flex gap-8 items-center relative overflow-hidden group"
                >
                  {/* Highlight para el top 1 */}
                  {idx === 0 && (
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-400 to-purple-500 rounded-l-full"></div>
                  )}

                  <div className="flex flex-col items-center justify-center shrink-0 w-32">
                     <div className={`text-6xl font-black tracking-tighter mb-3 ${idx === 0 ? 'text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-purple-400' : 'text-slate-500'}`}>
                        #{idx + 1}
                     </div>
                     <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl font-bold ${idx === 0 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-900/50 text-slate-400'}`}>
                        <ThumbsUp className={`w-7 h-7 ${idx === 0 ? 'fill-indigo-400' : 'fill-slate-500'}`} />
                        <span className="text-3xl">{q.likes}</span>
                     </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className={`text-4xl lg:text-5xl font-medium leading-tight mb-6 ${idx === 0 ? 'text-white' : 'text-slate-200'}`}>
                      "{q.pregunta}"
                    </p>
                    <div className="flex items-center gap-5">
                      <div className="bg-slate-700/50 text-slate-300 font-semibold px-5 py-2 rounded-full text-xl">
                        {q.nombre}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.8);
        }
      `}</style>
    </div>
  );
}
