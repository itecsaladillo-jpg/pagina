"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Clock, ShieldAlert, Lock, ArrowLeft, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [eventoTitle, setEventoTitle] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    const checkUserRoleAndFetch = async () => {
      try {
        setCheckingAuth(true);
        // 1. Obtener usuario de auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("Error obteniendo usuario autenticado:", authError);
          setCheckingAuth(false);
          return;
        }

        // 2. Obtener miembro de la base de datos
        const { data: member, error: memberError } = await supabase
          .from("members")
          .select("role, full_name")
          .eq("id", user.id)
          .single();

        if (memberError) {
          console.error("Error obteniendo rol del miembro:", memberError);
        } else if (member) {
          setUserRole(member.role);
          setUserName(member.full_name);
        }

        // 3. Obtener detalles del evento
        const { data: evento } = await supabase
          .from("itec_actions")
          .select("title")
          .eq("id", eventoId)
          .single();
        if (evento) {
          setEventoTitle(evento.title);
        }

        // 4. Cargar preguntas iniciales si tiene un rol con permisos
        if (member && ["admin", "coordinador", "colaborador"].includes(member.role)) {
          const { data: questionsData, error: questionsError } = await supabase
            .from("evento_preguntas")
            .select("id, nombre, pregunta, created_at")
            .eq("evento_id", eventoId)
            .eq("aprobada", false)
            .order("created_at", { ascending: true });

          if (questionsError) {
            console.error("Error al cargar preguntas para moderar:", questionsError);
          } else if (questionsData) {
            const formatted = questionsData.map(q => ({
              ...q,
              nombre: q.nombre || "Anónimo"
            }));
            setPreguntas(formatted);
          }
        }
      } catch (err) {
        console.error("Error crítico en inicialización:", err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkUserRoleAndFetch();

    // 5. Suscribirse a cambios Realtime sólo si se tiene permisos
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
    const { error } = await supabase.from("evento_preguntas").update({ aprobada: true }).eq("id", id);
    if (error) {
      console.error("Error al aprobar pregunta:", error);
      alert("No se pudo aprobar la pregunta en la base de datos.");
    }
  };

  const handleDescartar = async (id: string) => {
    if (!confirm("¿Seguro que quieres descartar esta pregunta?")) return;
    setPreguntas((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("evento_preguntas").delete().eq("id", id);
    if (error) {
      console.error("Error al descartar pregunta:", error);
      alert("No se pudo eliminar la pregunta de la base de datos.");
    }
  };

  // 1. Mostrar pantalla de carga
  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500/20 opacity-75"></span>
          <div className="h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-zinc-400 text-sm font-semibold tracking-wide animate-pulse">
          Validando credenciales y cargando panel...
        </p>
      </div>
    );
  }

  // 2. Pantalla de Acceso Denegado / Rol Insuficiente
  const hasPermissions = userRole && ["admin", "coordinador", "colaborador"].includes(userRole);
  if (!hasPermissions) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-8 mt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-zinc-900/60 border border-amber-500/20 rounded-[2rem] p-8 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          {/* Decoración */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 mb-6 animate-pulse">
            <Lock size={28} />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mb-3">
            Acceso Restringido a Moderadores
          </h2>
          
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Hola <strong className="text-white font-bold">{userName || "Usuario"}</strong>. 
            Tu cuenta actualmente cuenta con el rol de <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-extrabold text-xs uppercase tracking-wide">{userRole || "miembro"}</span>. 
            Para moderar las preguntas de los eventos, requerís rol de <strong>Administrador</strong>, <strong>Coordinador</strong> o <strong>Colaborador</strong>.
          </p>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 mb-8 text-left space-y-3.5 text-xs text-zinc-300">
            <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">¿Cómo solucionar esto?</p>
            <div className="flex gap-3 leading-relaxed">
              <span className="flex items-center justify-center shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[9px]">1</span>
              <span>Pedile a un <strong>Administrador</strong> del sistema que cambie tu rol desde la pestaña de <strong>Miembros</strong> del panel de control.</span>
            </div>
            <div className="flex gap-3 leading-relaxed">
              <span className="flex items-center justify-center shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[9px]">2</span>
              <span>Una vez que actualicen tu rol a <strong>Administrador</strong>, <strong>Coordinador</strong> o <strong>Colaborador</strong>, volvé a ingresar a esta sección.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ArrowLeft size={14} /> Volver al Inicio
            </Link>
            <Link
              href="/dashboard/miembros"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-950/40"
            >
              <Users size={14} /> Gestión de Miembros
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Pantalla de Moderación Premium Habilitada
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/dashboard"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Panel del Moderador ({userRole})
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Moderación de Preguntas
          </h1>
          {eventoTitle && (
            <p className="text-zinc-400 text-sm font-semibold mt-1 flex items-center gap-1.5 uppercase tracking-wide text-indigo-300">
              <Sparkles size={13} /> {eventoTitle}
            </p>
          )}
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-3 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">En espera</p>
            <p className="text-lg font-black text-white">{preguntas.length} consultas</p>
          </div>
        </div>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {preguntas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800 p-16 text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Todo al día</h3>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                  No hay nuevas preguntas para moderar en este momento. Las preguntas que envíen aparecerán aquí al instante.
                </p>
              </div>
            </motion.div>
          ) : (
            preguntas.map((q) => (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded border border-indigo-900/40">
                      {q.nombre}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-zinc-200 text-lg font-medium leading-relaxed">
                    "{q.pregunta}"
                  </p>
                </div>
                
                <div className="flex w-full md:w-auto gap-3 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-zinc-800/60 md:border-none">
                  <button
                    onClick={() => handleDescartar(q.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-500/20 text-red-400 bg-red-950/10 hover:bg-red-500/10 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Descartar</span>
                  </button>
                  <button
                    onClick={() => handleAprobar(q.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-950/40 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
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
