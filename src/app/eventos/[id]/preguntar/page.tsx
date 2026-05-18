"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThumbsUp, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Pregunta {
  id: string;
  nombre: string;
  pregunta: string;
  likes: number;
  created_at: string;
}

export default function PreguntarPage({ params }: { params: { id: string } }) {
  const [nombre, setNombre] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const supabase = createClient();
  const eventoId = params.id;

  useEffect(() => {
    // Cargar likes locales
    const localLikes = JSON.parse(localStorage.getItem(`likes_${eventoId}`) || "[]");
    setLikedIds(localLikes);

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
      .channel("public:evento_preguntas:assistant")
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
      .channel("public:evento_preguntas_likes:assistant")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pregunta.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg("");
    
    const { error } = await supabase.from("evento_preguntas").insert({
      evento_id: eventoId,
      nombre: nombre.trim() || "Anónimo",
      pregunta: pregunta.trim(),
      aprobada: false
    });

    if (!error) {
      setPregunta("");
      setSuccessMsg("¡Pregunta enviada! Aguardando moderación.");
      setTimeout(() => setSuccessMsg(""), 5000);
    } else {
      alert("Hubo un error al enviar tu pregunta.");
    }
    setIsSubmitting(false);
  };

  const handleLike = async (preguntaId: string) => {
    if (likedIds.includes(preguntaId)) return;

    const newLikedIds = [...likedIds, preguntaId];
    setLikedIds(newLikedIds);
    localStorage.setItem(`likes_${eventoId}`, JSON.stringify(newLikedIds));

    // Optimistic update for UI immediate response
    setPreguntas(prev => {
      const updated = prev.map(p => p.id === preguntaId ? { ...p, likes: p.likes + 1 } : p);
      return updated.sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    await supabase.from("evento_preguntas_likes").insert({
      pregunta_id: preguntaId
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 shadow-md rounded-b-3xl">
        <h1 className="text-2xl font-bold text-center tracking-tight">Preguntas en Vivo</h1>
        <p className="text-indigo-200 text-center text-sm mt-1">Participá enviando tus consultas</p>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Tu nombre (opcional)"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
            <div>
              <textarea
                placeholder="Escribí tu pregunta aquí..."
                required
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !pregunta.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Enviando...</span>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Pregunta
                </>
              )}
            </button>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-emerald-600 text-sm font-medium text-center bg-emerald-50 py-2 rounded-lg"
              >
                {successMsg}
              </motion.div>
            )}
          </form>
        </div>

        {/* Lista de Preguntas */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Preguntas de la audiencia</h2>
          
          <div className="space-y-3">
            <AnimatePresence>
              {preguntas.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-500 py-8 bg-white rounded-2xl border border-gray-100 border-dashed"
                >
                  Todavía no hay preguntas aprobadas. ¡Sé el primero en preguntar!
                </motion.p>
              ) : (
                preguntas.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-indigo-600 mb-1">{q.nombre}</p>
                      <p className="text-gray-800 text-sm leading-relaxed">{q.pregunta}</p>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleLike(q.id)}
                        disabled={likedIds.includes(q.id)}
                        className={`flex flex-col items-center justify-center gap-1 min-w-[50px] p-2 rounded-xl transition-colors ${
                          likedIds.includes(q.id)
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100 active:scale-95"
                        }`}
                      >
                        <ThumbsUp className={`w-5 h-5 ${likedIds.includes(q.id) ? "fill-current" : ""}`} />
                        <span className="text-xs font-bold">{q.likes}</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
