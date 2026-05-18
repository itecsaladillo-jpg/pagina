"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThumbsUp, Send, HelpCircle, User, Sparkles, CheckCircle2, MessageSquare, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Pregunta {
  id: string;
  nombre: string;
  pregunta: string;
  likes: number;
  created_at: string;
}

export default function PreguntarPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventoId = resolvedParams.id;
  const [nombre, setNombre] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showInstructions, setShowInstructions] = useState(true);
  
  const supabase = createClient();

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
                if (exists) {
                  // Si ya existe pero se actualizaron campos (ej. aprobada)
                  return prev;
                }
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
      setSuccessMsg("¡Pregunta enviada! Aguardando aprobación de moderación.");
      setTimeout(() => setSuccessMsg(""), 6000);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-24 overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-20%] w-[80%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0" />

      {/* Premium Header */}
      <header className="relative border-b border-white/[0.05] bg-slate-900/60 backdrop-blur-xl px-4 py-5 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                ITEC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-semibold">Q&A</span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">Preguntas al Expositor</p>
            </div>
          </div>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
            title="Cómo funciona"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 mt-6 space-y-6">
        
        {/* Dynamic Premium Instructions */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="overflow-hidden bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-5 shadow-2xl backdrop-blur-md relative"
            >
              <div className="absolute top-0 right-0 p-3">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/[0.03]"
                >
                  Entendido
                </button>
              </div>
              <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles size={16} /> ¿Cómo funciona el Q&A?
              </h2>
              <ul className="space-y-3.5 text-xs text-zinc-300">
                <li className="flex gap-3 leading-relaxed">
                  <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">1</span>
                  <span><strong>Escribí tu pregunta:</strong> Podés completarla con tu nombre o enviarla de forma 100% anónima.</span>
                </li>
                <li className="flex gap-3 leading-relaxed">
                  <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">2</span>
                  <span><strong>Moderación en vivo:</strong> Tu pregunta pasa al panel del moderador antes de proyectarse en pantalla gigante para asegurar el orden.</span>
                </li>
                <li className="flex gap-3 leading-relaxed">
                  <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">3</span>
                  <span><strong>Votación 👍 (Evitá duplicados):</strong> Revisá la lista de abajo. Si un participante ya preguntó lo que querías consultar, <strong>dale un voto 👍</strong> en vez de enviarla de nuevo. ¡Subirá en el ranking y el orador la verá primero!</span>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Form Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 backdrop-blur-sm shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">Tu Nombre (Opcional)</label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Ej. Juan de Saladillo (o dejar vacío)"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">Tu Pregunta / Consulta</label>
              <textarea
                placeholder="Escribí de forma clara y directa tu duda..."
                required
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pregunta.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Enviando consulta...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Pregunta en Vivo
                </>
              )}
            </button>
          </form>

          {/* Success Dialog */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-3"
              >
                <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Question Board */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400" /> Preguntas Aprobadas
            </h2>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
              En Vivo
            </span>
          </div>

          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {preguntas.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-zinc-500 py-12 px-6 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-3xl space-y-3"
                >
                  <MessageSquare size={28} className="mx-auto text-zinc-700" />
                  <p className="text-xs font-medium leading-relaxed">
                    Aún no hay preguntas aprobadas en este panel.<br />
                    ¡Sé el primero en formular una consulta!
                  </p>
                </motion.div>
              ) : (
                preguntas.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex gap-4 items-start relative shadow-md"
                  >
                    {/* Top 1 Indicator decoration */}
                    {idx === 0 && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-2xl" />
                    )}

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/50">
                          {q.nombre}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 flex items-center gap-1">
                            <Award size={10} /> Top
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-200 text-sm leading-relaxed font-medium">
                        "{q.pregunta}"
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center self-center">
                      <button
                        onClick={() => handleLike(q.id)}
                        disabled={likedIds.includes(q.id)}
                        className={`flex flex-col items-center justify-center gap-1 min-w-[54px] py-2.5 px-2 rounded-2xl transition-all border ${
                          likedIds.includes(q.id)
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : "bg-zinc-950/60 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-900 active:scale-90"
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${likedIds.includes(q.id) ? "fill-indigo-400" : ""}`} />
                        <span className="text-[10px] font-extrabold">{q.likes} 👍</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
