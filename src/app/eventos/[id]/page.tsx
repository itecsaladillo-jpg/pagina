"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { 
  ThumbsUp, 
  Send, 
  User, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  Award, 
  BarChart2, 
  Cloud, 
  Vote, 
  Phone, 
  Building, 
  Mail,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Evento {
  id: string;
  nombre_evento: string;
  fecha: string;
  slug_qr: string;
  estado_activo: boolean;
  herramienta_activa: "encuestas" | "preguntas" | "nube_ideas";
  encuesta_activa_id: string | null;
  nube_activa_id: string | null;
}

interface Asistente {
  id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  organizacion_o_escuela?: string;
}

interface Encuesta {
  id: string;
  pregunta: string;
  activa: boolean;
  opciones: OpcionEncuesta[];
}

interface OpcionEncuesta {
  id: string;
  texto_opcion: string;
  votos_count?: number;
}

interface Pregunta {
  id: string;
  nombre: string;
  pregunta: string;
  aprobada: boolean;
  created_at: string;
  likes: number;
}

export default function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { language, dict } = useLanguage();
  const resolvedParams = use(params);
  const idParam = resolvedParams.id;
  const router = useRouter();
  const supabase = createClient();

  // Estados principales
  const [evento, setEvento] = useState<Evento | null>(null);
  const [asistente, setAsistente] = useState<Asistente | null>(null);
  const [dispositivoId, setDispositivoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"encuestas" | "preguntas" | "nube_ideas" | "encuestas">("encuestas");
  
  // Estado para Banner Realtime
  const [showNotification, setShowNotification] = useState(false);
  const [notifTargetTab, setNotifTargetTab] = useState<"encuestas" | "preguntas" | "nube_ideas" | null>(null);
  const lastToolRef = useRef<string>("");

  // Estados del Formulario de Registro
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regOrg, setRegOrg] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState("");

  // Estados de Pestaña 1: Encuestas
  const [encuestaActiva, setEncuestaActiva] = useState<Encuesta | null>(null);
  const [votoRealizadoId, setVotoRealizadoId] = useState<string | null>(null);
  const [votosEncuesta, setVotosEncuesta] = useState<Record<string, number>>({});
  const [votosLoading, setVotosLoading] = useState(false);

  // Estados de Pestaña 2: Preguntas
  const [pregNombre, setPregNombre] = useState("");
  const [pregTexto, setPregTexto] = useState("");
  const [pregAnonima, setPregAnonima] = useState(false);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [pregLikedIds, setPregLikedIds] = useState<string[]>([]);
  const [pregSubmitting, setPregSubmitting] = useState(false);
  const [pregSuccess, setPregSuccess] = useState("");

  // Estados de Pestaña 3: Nube de Ideas
  const [nubePalabra, setNubePalabra] = useState("");
  const [nubeEnviada, setNubeEnviada] = useState<string | null>(null);
  const [nubeSubmitting, setNubeSubmitting] = useState(false);
  const [nubeSuccess, setNubeSuccess] = useState("");

  // 1. Detección Inteligente de UUID (Redirección para compatibilidad heredada)
  useEffect(() => {
    if (!idParam) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idParam)) {
      router.replace(`/eventos/${idParam}/preguntar`);
    }
  }, [idParam, router]);

  // 2. Carga Inicial y Setup de Dispositivo
  useEffect(() => {
    if (!idParam) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idParam)) return; // Se maneja por la redirección superior

    // Generar o recuperar ID de dispositivo único y anónimo
    let devId = localStorage.getItem("itec_dispositivo_id");
    if (!devId) {
      devId = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("itec_dispositivo_id", devId);
    }
    setDispositivoId(devId);

    const inicializar = async () => {
      try {
        setLoading(true);
        // Obtener Evento por slug_qr
        const { data: eventData, error: eventError } = await supabase
          .from("eventos")
          .select("*")
          .eq("slug_qr", idParam)
          .eq("estado_activo", true)
          .maybeSingle();

        if (eventError || !eventData) {
          console.warn("Evento no encontrado o inactivo:", eventError);
          setLoading(false);
          return;
        }

        const currentEvent = eventData as Evento;
        setEvento(currentEvent);
        lastToolRef.current = currentEvent.herramienta_activa;
        setActiveTab(currentEvent.herramienta_activa);

        // Buscar registro del asistente en localStorage
        const storedAsistente = localStorage.getItem(`asistente_registrado_${currentEvent.id}`);
        if (storedAsistente) {
          const parsed = JSON.parse(storedAsistente) as Asistente;
          setAsistente(parsed);
          setPregNombre(parsed.nombre_completo);
        }

        // Cargar palabras enviadas a la nube por el dispositivo
        const { data: nubeData } = await supabase
          .from("eventos_nube_palabras")
          .select("palabra")
          .eq("evento_id", currentEvent.id)
          .eq("dispositivo_id", devId)
          .maybeSingle();
        
        if (nubeData) {
          setNubeEnviada(nubeData.palabra);
        }

      } catch (err) {
        console.error("Error en inicialización del panel:", err);
      } finally {
        setLoading(false);
      }
    };

    inicializar();
  }, [idParam, supabase]);

  // 3. Suscripción Supabase Realtime para cambios del evento
  useEffect(() => {
    if (!evento) return;

    const eventChannel = supabase
      .channel(`realtime:evento_${evento.id}`)
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "eventos", 
          filter: `id=eq.${evento.id}` 
        },
        (payload) => {
          const newEventData = payload.new as Evento;
          setEvento(newEventData);

          if (newEventData.herramienta_activa !== lastToolRef.current) {
            lastToolRef.current = newEventData.herramienta_activa;
            
            if (newEventData.herramienta_activa !== activeTab) {
              setNotifTargetTab(newEventData.herramienta_activa);
              setShowNotification(true);
            } else {
              setShowNotification(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, [evento, activeTab, supabase]);

  // 4. Lógica de Pestaña 1: Encuestas (Carga y Sincronización)
  useEffect(() => {
    if (!evento || activeTab !== "encuestas") return;

    const fetchEncuestaYVotos = async () => {
      if (!evento.encuesta_activa_id) {
        setEncuestaActiva(null);
        return;
      }

      setVotosLoading(true);
      try {
        const { data: poll, error: pollError } = await supabase
          .from("eventos_encuestas")
          .select(`
            id,
            pregunta,
            activa,
            eventos_encuestas_opciones (
              id,
              texto_opcion
            )
          `)
          .eq("id", evento.encuesta_activa_id)
          .single();

        if (poll && !pollError) {
          const formattedPoll: Encuesta = {
            id: poll.id,
            pregunta: poll.pregunta,
            activa: poll.activa,
            opciones: (poll.eventos_encuestas_opciones || []) as OpcionEncuesta[]
          };
          setEncuestaActiva(formattedPoll);

          const localVoto = localStorage.getItem(`voto_encuesta_${poll.id}`);
          setVotoRealizadoId(localVoto);

          await refreshVotos(formattedPoll.opciones.map(o => o.id));
        } else {
          setEncuestaActiva(null);
        }
      } catch (err) {
        console.error("Error al cargar encuesta activa:", err);
      } finally {
        setVotosLoading(false);
      }
    };

    fetchEncuestaYVotos();

    const votosChannel = supabase
      .channel(`realtime:votos_${evento.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "eventos_encuestas_votos"
        },
        () => {
          if (encuestaActiva) {
            refreshVotos(encuestaActiva.opciones.map(o => o.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votosChannel);
    };
  }, [evento?.encuesta_activa_id, activeTab, supabase, encuestaActiva?.id]);

  const refreshVotos = async (opcionesIds: string[]) => {
    if (opcionesIds.length === 0) return;
    try {
      const { data, error } = await supabase
        .from("eventos_encuestas_votos")
        .select("opcion_id")
        .in("opcion_id", opcionesIds);

      if (data && !error) {
        const counts: Record<string, number> = {};
        opcionesIds.forEach(id => counts[id] = 0);
        data.forEach((v: any) => {
          counts[v.opcion_id] = (counts[v.opcion_id] || 0) + 1;
        });
        setVotosEncuesta(counts);
      }
    } catch (err) {
      console.error("Error al refrescar votos:", err);
    }
  };

  const handleVotar = async (opcionId: string) => {
    if (!encuestaActiva || votoRealizadoId || !dispositivoId) return;

    setVotoRealizadoId(opcionId);
    localStorage.setItem(`voto_encuesta_${encuestaActiva.id}`, opcionId);

    setVotosEncuesta(prev => ({
      ...prev,
      [opcionId]: (prev[opcionId] || 0) + 1
    }));

    try {
      const { error } = await supabase
        .from("eventos_encuestas_votos")
        .insert({
          opcion_id: opcionId,
          dispositivo_id: dispositivoId
        });

      if (error) {
        console.error("Error al registrar voto:", error);
      } else {
        refreshVotos(encuestaActiva.opciones.map(o => o.id));
      }
    } catch (err) {
      console.error("Error al votar:", err);
    }
  };

  // 5. Lógica de Pestaña 2: Muro de Preguntas en Vivo (Q&A)
  useEffect(() => {
    if (!evento || activeTab !== "preguntas") return;

    const localLikes = JSON.parse(localStorage.getItem(`likes_preguntas_${evento.id}`) || "[]");
    setPregLikedIds(localLikes);

    const fetchPreguntas = async () => {
      try {
        const { data, error } = await supabase
          .from("eventos_preguntas")
          .select(`
            id,
            nombre,
            pregunta,
            aprobada,
            created_at,
            eventos_preguntas_likes(count)
          `)
          .eq("evento_id", evento.id)
          .eq("aprobada", true);

        if (data && !error) {
          const formatted = data.map((q: any) => ({
            id: q.id,
            nombre: q.nombre || "Anónimo",
            pregunta: q.pregunta,
            aprobada: q.aprobada,
            created_at: q.created_at,
            likes: q.eventos_preguntas_likes?.[0]?.count || 0
          }));
          
          formatted.sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setPreguntas(formatted);
        }
      } catch (err) {
        console.error("Error al cargar preguntas:", err);
      }
    };

    fetchPreguntas();

    const preguntasChannel = supabase
      .channel(`realtime:preguntas_${evento.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "eventos_preguntas",
          filter: `evento_id=eq.${evento.id}`
        },
        async (payload) => {
          if (payload.eventType === "INSERT" && payload.new.aprobada) {
            const newQ: Pregunta = {
              id: payload.new.id,
              nombre: payload.new.nombre || "Anónimo",
              pregunta: payload.new.pregunta,
              aprobada: payload.new.aprobada,
              created_at: payload.new.created_at,
              likes: 0
            };
            setPreguntas(prev => [...prev, newQ].sort((a, b) => b.likes - a.likes));
          } else if (payload.eventType === "UPDATE") {
            if (payload.new.aprobada) {
              const { data: countData } = await supabase
                .from("eventos_preguntas_likes")
                .select("count", { count: "exact" })
                .eq("pregunta_id", payload.new.id);
              
              const currentLikes = countData?.[0]?.count || 0;

              setPreguntas(prev => {
                const exists = prev.find(p => p.id === payload.new.id);
                if (exists) {
                  return prev.map(p => p.id === payload.new.id ? {
                    ...p,
                    nombre: payload.new.nombre || "Anónimo",
                    pregunta: payload.new.pregunta,
                    aprobada: payload.new.aprobada
                  } : p);
                } else {
                  const newQ: Pregunta = {
                    id: payload.new.id,
                    nombre: payload.new.nombre || "Anónimo",
                    pregunta: payload.new.pregunta,
                    aprobada: payload.new.aprobada,
                    created_at: payload.new.created_at,
                    likes: currentLikes
                  };
                  return [...prev, newQ].sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                }
              });
            } else {
              setPreguntas(prev => prev.filter(p => p.id !== payload.old.id));
            }
          } else if (payload.eventType === "DELETE") {
            setPreguntas(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "eventos_preguntas_likes"
        },
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
      supabase.removeChannel(preguntasChannel);
    };
  }, [evento, activeTab, supabase]);

  const handleSendPregunta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento || !pregTexto.trim() || pregSubmitting) return;

    setPregSubmitting(true);
    setPregSuccess("");

    const displayNombre = pregAnonima ? "Anónimo" : (pregNombre.trim() || "Anónimo");

    try {
      const { error } = await supabase
        .from("eventos_preguntas")
        .insert({
          evento_id: evento.id,
          nombre: displayNombre,
          pregunta: pregTexto.trim(),
          aprobada: false
        });

      if (!error) {
        setPregTexto("");
        setPregSuccess("¡Pregunta enviada! Se mostrará en el muro una vez aprobada por la moderación.");
        setTimeout(() => setPregSuccess(""), 6000);
      } else {
        alert("Ocurrió un error al enviar tu consulta.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPregSubmitting(false);
    }
  };

  const handleLikePregunta = async (preguntaId: string) => {
    if (!evento || pregLikedIds.includes(preguntaId) || !dispositivoId) return;

    const newLikes = [...pregLikedIds, preguntaId];
    setPregLikedIds(newLikes);
    localStorage.setItem(`likes_preguntas_${evento.id}`, JSON.stringify(newLikes));

    setPreguntas(prev => {
      const updated = prev.map(p => p.id === preguntaId ? { ...p, likes: p.likes + 1 } : p);
      return updated.sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    try {
      await supabase
        .from("eventos_preguntas_likes")
        .insert({
          pregunta_id: preguntaId,
          dispositivo_id: dispositivoId
        });
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Lógica de Pestaña 3: Nube de Ideas
  const handleSendNubePalabra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento || !nubePalabra.trim() || nubeSubmitting || !dispositivoId) return;

    const palabraLimpia = nubePalabra.trim().replace(/\s+/g, "").substring(0, 25);
    if (!palabraLimpia) return;

    setNubeSubmitting(true);
    setNubeSuccess("");

    try {
      const { error } = await supabase
        .from("eventos_nube_palabras")
        .insert({
          evento_id: evento.id,
          palabra: palabraLimpia,
          dispositivo_id: dispositivoId
        });

      if (!error) {
        setNubeEnviada(palabraLimpia);
        setNubePalabra("");
        setNubeSuccess("¡Palabra enviada con éxito! Ya forma parte de la Nube de Ideas.");
        setTimeout(() => setNubeSuccess(""), 5000);
      } else if (error.code === "23505") {
        setNubeEnviada(palabraLimpia);
        alert("Ya has enviado una palabra para este evento.");
      } else {
        alert("Error al enviar la palabra.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNubeSubmitting(false);
    }
  };

  // 7. Lógica del Registro de Asistente (Flujo A)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento || regSubmitting) return;

    if (!regNombre.trim() || !regEmail.trim()) {
      setRegError("Por favor completá los campos obligatorios.");
      return;
    }

    setRegSubmitting(true);
    setRegError("");

    try {
      const res = await fetch("/api/eventos/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventoId: evento.id,
          nombreCompleto: regNombre,
          email: regEmail,
          telefono: regTelefono || null,
          organizacionOEscuela: regOrg || null,
          eventSlug: evento.slug_qr,
          eventName: evento.nombre_evento
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const registeredAsistente = data.asistente as Asistente;
        
        localStorage.setItem(`asistente_registrado_${evento.id}`, JSON.stringify(registeredAsistente));
        setAsistente(registeredAsistente);
        setPregNombre(registeredAsistente.nombre_completo);

        setActiveTab(evento.herramienta_activa);
      } else {
        setRegError(data.error || "Ocurrió un error al procesar el registro.");
      }
    } catch (err) {
      console.error(err);
      setRegError("No se pudo conectar con el servidor. Reintentá en unos momentos.");
    } finally {
      setRegSubmitting(false);
    }
  };

  // 8. Tocar la notificación flotante
  const handleNotifClick = () => {
    if (notifTargetTab) {
      setActiveTab(notifTargetTab);
    }
    setShowNotification(false);
  };

  // Renderizadores auxiliares
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <Image src="/logoitectrans_v2.png" alt="Cargando" width={32} height={12} className="opacity-70 animate-pulse" />
        </div>
        <p className="text-xs font-black tracking-widest text-indigo-400 uppercase animate-pulse">{dict.eventos.cargando}</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <AlertCircle size={44} className="text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-lg font-black text-white tracking-tight uppercase mb-2">{dict.eventos.eventoNoActivo}</h1>
        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
          {dict.eventos.eventoNoActivoDesc}
        </p>
        <button 
          onClick={() => router.push("/")}
          className="mt-6 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 px-5 py-2.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer transition-all"
        >
          {dict.eventos.volverInicio}
        </button>
      </div>
    );
  }

  // --- FLUJO A: FORMULARIO DE PRE-ACREDITACIÓN ---
  if (!asistente) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-12 overflow-x-hidden relative flex flex-col justify-between selection:bg-indigo-500/30 selection:text-white">
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none z-0" />
        <div className="fixed top-[-10%] left-[-20%] w-[80%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0" />

        <header className="relative z-10 border-b border-white/[0.05] bg-slate-950/80 backdrop-blur-xl px-4 py-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Image 
                  src="/logoitectrans_v2.png" 
                  alt="Logo ITEC" 
                  width={70} 
                  height={24} 
                  className="h-5.5 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  priority
                />
              </Link>
              <div className="w-[1px] h-3 bg-zinc-800" />
              <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase">
                {dict.eventos.acreditacion.titulo}
              </span>
            </div>
            <span className="text-[9px] font-extrabold text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.05]">
              {dict.eventos.acreditacion.badge}
            </span>
          </div>
        </header>

        <main className="relative z-10 max-w-md w-full mx-auto px-4 mt-6 flex-1 flex flex-col justify-center">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase text-gradient">
              {evento.nombre_evento}
            </h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              {dict.eventos.acreditacion.desc}
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            
            <form onSubmit={handleRegister} className="space-y-4">
              {regError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                  {dict.eventos.acreditacion.nombre} <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder={dict.eventos.acreditacion.nombrePlaceholder}
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    autoCapitalize="words"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-600 focus:outline-none transition-colors text-sm h-[48px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                  {dict.eventos.acreditacion.email} <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder={dict.eventos.acreditacion.emailPlaceholder}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoCapitalize="none"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-600 focus:outline-none transition-colors text-sm h-[48px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                  {dict.eventos.acreditacion.telefono}
                </label>
                <div className="relative flex items-center">
                  <Phone size={16} className="absolute left-3.5 text-zinc-500" />
                  <input
                    type="tel"
                    placeholder={dict.eventos.acreditacion.telefonoPlaceholder}
                    value={regTelefono}
                    onChange={(e) => setRegTelefono(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-600 focus:outline-none transition-colors text-sm h-[48px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                  {dict.eventos.acreditacion.organizacion}
                </label>
                <div className="relative flex items-center">
                  <Building size={16} className="absolute left-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder={dict.eventos.acreditacion.organizacionPlaceholder}
                    value={regOrg}
                    onChange={(e) => setRegOrg(e.target.value)}
                    autoCapitalize="sentences"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-600 focus:outline-none transition-colors text-sm h-[48px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.97] cursor-pointer h-[50px] mt-2"
              >
                {regSubmitting ? (
                  <span className="animate-pulse">{dict.eventos.acreditacion.acreditando}</span>
                ) : (
                  <>
                    {dict.eventos.acreditacion.boton}
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>

        <footer className="relative z-10 py-6 text-center">
          <p className="text-[10px] text-zinc-500 tracking-wider">
            ITEC SALADILLO — {language === 'en' ? 'Live Auditorium' : 'Auditorio Presencial'}
          </p>
        </footer>
      </div>
    );
  }

  // --- FLUJO B: PANEL UNIFICADO DEL PARTICIPANTE ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-24 overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-20%] w-[80%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0" />

      <header className="relative border-b border-white/[0.05] bg-slate-950/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image 
                src="/logoitectrans_v2.png" 
                alt="Logo ITEC" 
                width={65} 
                height={22} 
                className="h-5.5 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                priority
              />
            </Link>
            <div className="w-[1px] h-3 bg-zinc-800" />
            <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase">
              {dict.eventos.panel.interactua}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
              {dict.eventos.panel.auditorio}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-4">
        <div className="text-center py-2">
          <h2 className="text-lg font-black text-white uppercase tracking-tight line-clamp-1">{evento.nombre_evento}</h2>
          <p className="text-[9px] text-zinc-400 font-medium">{dict.eventos.panel.asistente} <span className="text-indigo-400 font-extrabold">{asistente.nombre_completo}</span></p>
        </div>
      </div>

      <nav className="max-w-md mx-auto px-4 mt-3">
        <div className="flex bg-zinc-900/50 border border-zinc-850 p-1 rounded-2xl backdrop-blur-sm relative">
          <button
            onClick={() => setActiveTab("encuestas")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer relative z-10 ${
              activeTab === "encuestas" 
                ? "text-white" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Vote size={15} />
            {dict.eventos.panel.tabEncuestas}
            {evento.herramienta_activa === "encuestas" && (
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full absolute top-2.5 right-2.5 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("preguntas")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer relative z-10 ${
              activeTab === "preguntas" 
                ? "text-white" 
                : "text-zinc-500 hover:text-zinc-350"
            }`}
          >
            <MessageSquare size={15} />
            {dict.eventos.panel.tabPreguntas}
            {evento.herramienta_activa === "preguntas" && (
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full absolute top-2.5 right-2.5 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("nube_ideas")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer relative z-10 ${
              activeTab === "nube_ideas" 
                ? "text-white" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Cloud size={15} />
            {dict.eventos.panel.tabNube}
            {evento.herramienta_activa === "nube_ideas" && (
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full absolute top-2.5 right-2.5 animate-pulse" />
            )}
          </button>

          <div 
            className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl transition-all duration-300 pointer-events-none"
            style={{
              width: "calc(33.333% - 4px)",
              left: activeTab === "encuestas" ? "4px" : activeTab === "preguntas" ? "33.333%" : "calc(66.666% - 4px)"
            }}
          />
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-4 relative z-10">
        
        {/* --- PESTAÑA 1: ENCUESTAS --- */}
        {activeTab === "encuestas" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-4 shadow-xl">
              <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-400" /> {language === 'en' ? 'Live Voting' : language === 'pt' ? 'Votação Ao Vivo' : 'Votación en Vivo'}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                {language === 'en' ? 'Vote options in real time as the speaker activates them on the main screen.' : language === 'pt' ? 'Vote nas opções em tempo real à medida que o palestrante as ativa na tela principal.' : 'Votá las opciones en tiempo real a medida que el disertante las active en la pantalla principal.'}
              </p>
            </div>

            {votosLoading ? (
              <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-6 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-zinc-500">{language === 'en' ? 'Loading poll...' : language === 'pt' ? 'Carregando enquete...' : 'Cargando encuesta...'}</p>
              </div>
            ) : encuestaActiva ? (
              <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 backdrop-blur-sm space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
                
                <h4 className="text-sm font-black text-white leading-snug">
                  {encuestaActiva.pregunta}
                </h4>

                <div className="space-y-3">
                  {encuestaActiva.opciones.map((opc) => {
                    const totalVotos = Object.values(votosEncuesta).reduce((a, b) => a + b, 0);
                    const votosOpc = votosEncuesta[opc.id] || 0;
                    const porcentaje = totalVotos > 0 ? Math.round((votosOpc / totalVotos) * 100) : 0;
                    const yaVoto = votoRealizadoId !== null;
                    const esEstaOpc = votoRealizadoId === opc.id;

                    return (
                      <div key={opc.id} className="relative">
                        {yaVoto ? (
                          <div className="w-full p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl relative overflow-hidden flex justify-between items-center h-[54px]">
                            <div 
                              className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-l-2xl ${
                                esEstaOpc 
                                  ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border-r border-indigo-500/30" 
                                  : "bg-white/[0.02]"
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                            
                            <span className={`text-xs font-bold relative z-10 flex items-center gap-2 ${esEstaOpc ? 'text-indigo-300' : 'text-zinc-300'}`}>
                              {esEstaOpc && <CheckCircle2 size={14} className="text-indigo-400 shrink-0" />}
                              {opc.texto_opcion}
                            </span>
                            
                            <span className="text-xs font-black relative z-10 text-indigo-400">
                              {porcentaje}% <span className="text-[9px] text-zinc-600 font-extrabold ml-1">({votosOpc})</span>
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVotar(opc.id)}
                            className="w-full p-4 bg-zinc-950/40 hover:bg-zinc-950/60 border border-zinc-850 hover:border-zinc-700 rounded-2xl text-left text-xs font-bold text-zinc-300 hover:text-white transition-all active:scale-[0.98] cursor-pointer flex justify-between items-center h-[54px]"
                          >
                            <span>{opc.texto_opcion}</span>
                            <ChevronRight size={14} className="text-zinc-600 shrink-0" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {votoRealizadoId && (
                  <p className="text-[10px] text-zinc-500 text-center font-semibold italic animate-pulse">
                    {language === 'en' ? '✓ Your vote has been registered. Results are updated live.' : language === 'pt' ? '✓ Seu voto foi registrado. Os resultados são atualizados ao vivo.' : '✓ Tu voto ha sido registrado. Los resultados se actualizan en vivo.'}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl p-12 text-center space-y-3">
                <Vote size={32} className="mx-auto text-zinc-700" />
                <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                  {dict.eventos.panel.encuestasVacias}<br />
                  <span className="text-[10px] text-zinc-600 font-normal">{language === 'en' ? 'Listen to the speaker to know when a poll will be active.' : language === 'pt' ? 'Ouça o palestrante para saber quando ele ativará uma.' : 'Escuchá al orador para saber cuándo activará una.'}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- PESTAÑA 2: PREGUNTAS EN VIVO (Q&A) --- */}
        {activeTab === "preguntas" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-4 shadow-xl">
              <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-400" /> Bloque de Preguntas
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                Dejá tu consulta de forma clara para el bloque de preguntas al final. Votá con 👍 las preguntas que más te gusten.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 backdrop-blur-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
              
              <form onSubmit={handleSendPregunta} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block px-1">
                    Tu Nombre
                  </label>
                  <button
                    type="button"
                    onClick={() => setPregAnonima(!pregAnonima)}
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      pregAnonima
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        : "bg-white/[0.03] text-zinc-500 border-zinc-800"
                    }`}
                  >
                    Enviar Anónimo
                  </button>
                </div>

                {!pregAnonima && (
                  <div className="relative flex items-center">
                    <User size={16} className="absolute left-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Identificate (o presioná anónimo)"
                      value={pregNombre}
                      onChange={(e) => setPregNombre(e.target.value)}
                      autoCapitalize="words"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-650 focus:outline-none transition-colors text-sm h-[44px]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                      Pregunta al Orador
                    </label>
                    <span className="text-[9px] font-extrabold text-zinc-500">{pregTexto.length} / 250</span>
                  </div>
                  <textarea
                    required
                    maxLength={250}
                    placeholder="Escribí tu consulta clara para el disertante..."
                    value={pregTexto}
                    onChange={(e) => setPregTexto(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-655 focus:outline-none transition-colors text-xs resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pregSubmitting || !pregTexto.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-850 disabled:to-zinc-850 disabled:text-zinc-600 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.97] cursor-pointer h-[46px]"
                >
                  {pregSubmitting ? (
                    <span className="animate-pulse">Enviando consulta...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Enviar Pregunta en Vivo
                    </>
                  )}
                </button>
              </form>

              {pregSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2.5 leading-relaxed">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{pregSuccess}</span>
                </div>
              )}
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-indigo-400" /> Preguntas en el Muro
                </h4>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest animate-pulse">
                  En Vivo
                </span>
              </div>

              <div className="space-y-3">
                {preguntas.length === 0 ? (
                  <div className="text-center py-10 px-6 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                    <MessageSquare size={24} className="mx-auto text-zinc-700" />
                    <p className="text-[11px] font-bold text-zinc-500 leading-relaxed">
                      Aún no hay preguntas aprobadas en el muro.<br />
                      <span className="font-normal text-zinc-600">¡Sé el primero en formular una consulta!</span>
                    </p>
                  </div>
                ) : (
                  preguntas.map((q, idx) => (
                    <div 
                      key={q.id}
                      className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-4 flex gap-4 items-start relative shadow-md"
                    >
                      {idx === 0 && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-2xl" />
                      )}

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
                            {q.nombre}
                          </span>
                          {idx === 0 && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 flex items-center gap-0.5 shrink-0">
                              <Award size={10} /> Destacada
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-200 text-xs leading-relaxed font-semibold">
                          "{q.pregunta}"
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center self-center">
                        <button
                          onClick={() => handleLikePregunta(q.id)}
                          disabled={pregLikedIds.includes(q.id)}
                          className={`flex flex-col items-center justify-center gap-1 min-w-[48px] py-2 px-1.5 rounded-xl transition-all border cursor-pointer ${
                            pregLikedIds.includes(q.id)
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                              : "bg-zinc-950/60 text-zinc-500 border-zinc-800 hover:text-zinc-350 hover:bg-zinc-900 active:scale-90"
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${pregLikedIds.includes(q.id) ? "fill-indigo-400 text-indigo-400" : ""}`} />
                          <span className="text-[9px] font-black">{q.likes} 👍</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA 3: NUBE DE IDEAS --- */}
        {activeTab === "nube_ideas" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-4 shadow-xl">
              <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-400" /> Nube Colectiva
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                Escribí una palabra clave que resuma lo aprendido cuando el profesor lo indique en el proyector.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 backdrop-blur-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
              
              {nubeEnviada ? (
                <div className="text-center py-6 space-y-3.5">
                  <Cloud size={40} className="mx-auto text-indigo-400 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-400">Tu palabra aportada es:</p>
                    <span className="inline-block text-lg font-black tracking-tight text-white uppercase bg-indigo-500/10 border border-indigo-500/30 px-5 py-2 rounded-2xl">
                      {nubeEnviada}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-semibold max-w-xs mx-auto leading-relaxed">
                    ¡Gracias por tu participación! Tu concepto ya forma parte del lienzo colectivo en la pantalla principal.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendNubePalabra} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                        Tu Palabra Clave
                      </label>
                      <span className="text-[9px] font-extrabold text-zinc-500">Máx 25 letras</span>
                    </div>
                    <div className="relative flex items-center">
                      <Cloud size={16} className="absolute left-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        maxLength={25}
                        placeholder="Ej. Innovacion (una sola palabra)"
                        value={nubePalabra}
                        onChange={(e) => setNubePalabra(e.target.value.replace(/\s+/g, ""))}
                        autoCapitalize="characters"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-650 focus:outline-none transition-colors text-sm h-[44px] uppercase font-bold tracking-wide"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={nubeSubmitting || !nubePalabra.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-850 disabled:to-zinc-850 disabled:text-zinc-600 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.97] cursor-pointer h-[46px]"
                  >
                    {nubeSubmitting ? (
                      <span className="animate-pulse">Enviando palabra...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Sumar a la Nube
                      </>
                    )}
                  </button>
                </form>
              )}

              {nubeSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2.5 leading-relaxed">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{nubeSuccess}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto"
          >
            <button
              onClick={handleNotifClick}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 border border-cyan-400/40 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-left active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 animate-bounce">
                  <Sparkles size={16} className="text-cyan-300" />
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-cyan-200">
                    ¡Actividad en Vivo!
                  </h5>
                  <p className="text-xs font-extrabold text-white leading-tight">
                    {notifTargetTab === "encuestas" && "¡Nueva encuesta activa! Tocá para votar."}
                    {notifTargetTab === "preguntas" && "¡Muro de preguntas en curso! Consultá o votá."}
                    {notifTargetTab === "nube_ideas" && "¡Nube de Ideas activa! Sumá tu concepto."}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-white animate-pulse" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
