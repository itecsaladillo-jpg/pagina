"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PreguntaModeracion {
  id: string;
  nombre: string;
  pregunta: string;
  created_at: string;
}

export default function ModeracionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventoId = resolvedParams.id;
  const [preguntas, setPreguntas] = useState<PreguntaModeracion[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchPreguntas = async () => {
      const { data, error } = await supabase
        .from("evento_preguntas")
        .select("id, nombre, pregunta, created_at")
        .eq("evento_id", eventoId)
        .eq("aprobada", false)
        .order("created_at", { ascending: true });
        
      if (data && !error) {
        const formatted = data.map(q => ({
            ...q,
            nombre: q.nombre || "Anónimo"
        }));
        setPreguntas(formatted);
      }
    };
    fetchPreguntas();

    const channel = supabase
      .channel("moderacion_preguntas")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "evento_preguntas", filter: `evento_id=eq.${eventoId}` },
        (payload) => {
          if (!payload.new.aprobada) {
            setPreguntas((prev) => {
                const exists = prev.find(p => p.id === payload.new.id);
                if (exists) return prev;
                return [...prev, {
                    id: payload.new.id,
                    nombre: payload.new.nombre || "Anónimo",
                    pregunta: payload.new.pregunta,
                    created_at: payload.new.created_at
                }];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "evento_preguntas", filter: `evento_id=eq.${eventoId}` },
        (payload) => {
          if (payload.new.aprobada) {
            setPreguntas((prev) => prev.filter((p) => p.id !== payload.new.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "evento_preguntas", filter: `evento_id=eq.${eventoId}` },
        (payload) => {
          setPreguntas((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventoId, supabase]);

  const handleAprobar = async (id: string) => {
    setPreguntas((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("evento_preguntas").update({ aprobada: true }).eq("id", id);
  };

  const handleDescartar = async (id: string) => {
    if (!confirm("¿Seguro que quieres descartar esta pregunta?")) return;
    setPreguntas((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("evento_preguntas").delete().eq("id", id);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Moderación de Preguntas</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {preguntas.length} preguntas en cola de espera
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {preguntas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-900">Todo al día</h3>
              <p className="text-slate-500 mt-2">No hay nuevas preguntas para moderar.</p>
            </motion.div>
          ) : (
            preguntas.map((q) => (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-sm">
                      {q.nombre}
                    </div>
                    <span className="text-sm text-slate-400 font-medium">
                      {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-800 text-lg md:text-xl leading-relaxed">{q.pregunta}</p>
                </div>
                
                <div className="flex w-full md:w-auto gap-3 shrink-0 mt-4 md:mt-0">
                  <button
                    onClick={() => handleDescartar(q.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-semibold transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Descartar</span>
                  </button>
                  <button
                    onClick={() => handleAprobar(q.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Lanzar a Pantalla</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
