"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Vote, 
  MessageSquare, 
  Cloud, 
  Play, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Users, 
  Sparkles, 
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrafficCone,
  ToggleLeft,
  Monitor,
  RefreshCw
} from "lucide-react";

interface HerramientasActivas {
  encuestas: boolean;
  preguntas: boolean;
  nube: boolean;
  semaforo: boolean;
}

type ModoPantalla = 'bienvenida' | 'nube' | 'encuestas' | 'preguntas';

interface Evento {
  id: string;
  nombre_evento: string;
  fecha: string;
  slug_qr: string;
  estado_activo: boolean;
  herramienta_activa: "encuestas" | "preguntas" | "nube_ideas";
  encuesta_activa_id: string | null;
  nube_activa_id: string | null;
  semaforo_last_reset_at: string | null;
  herramientas_activas: HerramientasActivas;
  modo_pantalla_gigante: ModoPantalla;
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
}

interface Pregunta {
  id: string;
  nombre: string;
  pregunta: string;
  aprobada: boolean;
  created_at: string;
  likes: number;
}

interface PalabraNube {
  palabra: string;
  cantidad: number;
}

export default function PanelOradorClient({ initialEvento }: { initialEvento: Evento }) {
  const router = useRouter();
  const supabase = createClient();

  // Estados principales
  console.log("[INIT] initialEvento keys:", Object.keys(initialEvento));
  console.log("[INIT] herramientas_activas from DB:", (initialEvento as any).herramientas_activas);

  const [evento, setEvento] = useState<Evento>(() => ({
    ...initialEvento,
    herramientas_activas: (initialEvento as any).herramientas_activas ?? { encuestas: false, preguntas: false, nube: false, semaforo: false },
    modo_pantalla_gigante: (initialEvento as any).modo_pantalla_gigante ?? 'bienvenida',
  }));
  const [panelTab, setPanelTab] = useState<"herramientas" | "moderacion" | "nube" | "semaforo">("herramientas");
  const [copiedLink, setCopiedLink] = useState(false);
  const [asistentesCount, setAsistentesCount] = useState(0);

  // Estados de Encuestas
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [encuestaNuevaPregunta, setEncuestaNuevaPregunta] = useState("");
  const [encuestaNuevaOpciones, setEncuestaNuevaOpciones] = useState<string[]>(["", ""]);
  const [encuestaSubmitting, setEncuestaSubmitting] = useState(false);
  const [votosEncuesta, setVotosEncuesta] = useState<Record<string, number>>({});
  const [encuestaActivaVotosCount, setEncuestaActivaVotosCount] = useState(0);

  // Estados de Preguntas (Q&A)
  const [preguntasPendientes, setPreguntasPendientes] = useState<Pregunta[]>([]);
  const [preguntasAprobadas, setPreguntasAprobadas] = useState<Pregunta[]>([]);

  // Estados de Nube de Ideas
  const [palabrasNube, setPalabrasNube] = useState<PalabraNube[]>([]);

  // Estados de Semáforo
  const [estadoSemaforo, setEstadoSemaforo] = useState<{ totalAcreditados: number; votosNegativos: number; porcentajeNegativo: number; estado: 'VERDE' | 'AMARILLO' | 'ROJO' } | null>(null);
  const [resetSemaforoLoading, setResetSemaforoLoading] = useState(false);

  // 1. Carga Inicial y Conteo de Asistentes
  useEffect(() => {
    const fetchInicial = async () => {
      // Conteo de asistentes acreditados
      const { count } = await supabase
        .from("eventos_asistentes")
        .select("id", { count: "exact" })
        .eq("evento_id", evento.id);
      
      setAsistentesCount(count || 0);

      // Cargar encuestas
      fetchEncuestas();

      // Cargar preguntas en vivo
      fetchPreguntas();

      // Cargar nube de ideas
      fetchNube();
    };

    fetchInicial();

    // Sincronizar recuentos de asistentes en tiempo real
    const asistentesChannel = supabase
      .channel(`realtime:asistentes_${evento.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "eventos_asistentes",
          filter: `evento_id=eq.${evento.id}`
        },
        () => {
          setAsistentesCount(prev => prev + 1);
        }
      )
      .subscribe();

    // Sincronizar cambios del evento en tiempo real (herramientas_activas, modo_pantalla, etc.)
    const eventoChannel = supabase
      .channel(`realtime:panel_evento_${evento.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "eventos",
          filter: `id=eq.${evento.id}`
        },
        (payload) => {
          const updated = payload.new as Partial<Evento>;
          setEvento(prev => ({ ...prev, ...updated }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(asistentesChannel);
      supabase.removeChannel(eventoChannel);
    };
  }, [evento.id, supabase]);

  // 2. Suscripción en tiempo real a Votos de la Encuesta Activa
  useEffect(() => {
    if (!evento.encuesta_activa_id) {
      setVotosEncuesta({});
      setEncuestaActivaVotosCount(0);
      return;
    }

    const fetchVotosYActivarRealtime = async () => {
      // Obtener opciones de la encuesta activa
      const { data: optionsData } = await supabase
        .from("eventos_encuestas_opciones")
        .select("id")
        .eq("encuesta_id", evento.encuesta_activa_id);

      const opcionesIds = (optionsData || []).map(o => o.id);
      if (opcionesIds.length === 0) return;

      const refreshVotosLocal = async () => {
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
          setEncuestaActivaVotosCount(data.length);
        }
      };

      refreshVotosLocal();

      // Suscribirse a inserción de votos en tiempo real
      const votosRealtimeChannel = supabase
        .channel(`realtime:orador_votos_${evento.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "eventos_encuestas_votos"
          },
          () => {
            refreshVotosLocal();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(votosRealtimeChannel);
      };
    };

    fetchVotosYActivarRealtime();
  }, [evento.encuesta_activa_id, supabase]);

  // 3. Suscripción Realtime a Preguntas Formuladas por la Audiencia (Q&A)
  useEffect(() => {
    const questionsChannel = supabase
      .channel(`realtime:orador_preguntas_${evento.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "eventos_preguntas",
          filter: `evento_id=eq.${evento.id}`
        },
        () => {
          fetchPreguntas();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "eventos_preguntas_likes"
        },
        () => {
          fetchPreguntas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(questionsChannel);
    };
  }, [evento.id, supabase]);

  // 4. Suscripción Realtime a Palabras de la Nube de Ideas
  useEffect(() => {
    const nubeChannel = supabase
      .channel(`realtime:orador_nube_${evento.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "eventos_nube_palabras",
          filter: `evento_id=eq.${evento.id}`
        },
        () => {
          fetchNube();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(nubeChannel);
    };
  }, [evento.id, supabase]);

  // 5. Semáforo: fetch inicial y suscripción Realtime
  useEffect(() => {
    const fetchEstadoSemaforo = async () => {
      const { count: totalAcreditados } = await supabase
        .from("eventos_asistentes")
        .select("*", { count: "exact", head: true })
        .eq("evento_id", evento.id);

      const { data: eventoData } = await supabase
        .from("eventos")
        .select("semaforo_last_reset_at")
        .eq("id", evento.id)
        .single();

      const lastResetAt = eventoData?.semaforo_last_reset_at;

      let votosNegativos = 0;
      if (lastResetAt) {
        const { count } = await supabase
          .from("evento_semaforo_votos")
          .select("*", { count: "exact", head: true })
          .eq("evento_id", evento.id)
          .eq("voto", "negativo")
          .gte("created_at", lastResetAt);

        votosNegativos = count ?? 0;
      }

      const total = totalAcreditados ?? 0;
      const porcentajeNegativo = total === 0 ? 0 : Math.round((votosNegativos / total) * 100);

      let estado: 'VERDE' | 'AMARILLO' | 'ROJO';
      if (porcentajeNegativo < 30) estado = "VERDE";
      else if (porcentajeNegativo < 50) estado = "AMARILLO";
      else estado = "ROJO";

      setEstadoSemaforo({ totalAcreditados: total, votosNegativos, porcentajeNegativo, estado });
    };

    fetchEstadoSemaforo();

    const semaforoChannel = supabase
      .channel(`realtime:orador_semaforo_${evento.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "evento_semaforo_votos",
          filter: `evento_id=eq.${evento.id}`
        },
        () => {
          fetchEstadoSemaforo();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "eventos",
          filter: `id=eq.${evento.id}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).semaforo_last_reset_at !== (payload.old as any).semaforo_last_reset_at) {
            fetchEstadoSemaforo();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(semaforoChannel);
    };
  }, [evento.id, supabase]);

  // --- MÉTODOS DE DATOS ---

  const fetchEncuestas = async () => {
    const { data, error } = await supabase
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
      .eq("evento_id", evento.id)
      .order("created_at", { ascending: false });

    if (data && !error) {
      const formatted = data.map((d: any) => ({
        id: d.id,
        pregunta: d.pregunta,
        activa: d.activa,
        opciones: d.eventos_encuestas_opciones || []
      }));
      setEncuestas(formatted);
    }
  };

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
        .eq("evento_id", evento.id);

      if (data && !error) {
        const formatted: Pregunta[] = data.map((q: any) => ({
          id: q.id,
          nombre: q.nombre || "Anónimo",
          pregunta: q.pregunta,
          aprobada: q.aprobada,
          created_at: q.created_at,
          likes: q.eventos_preguntas_likes?.[0]?.count || 0
        }));

        // Clasificar y ordenar
        const pendientes = formatted.filter(q => !q.aprobada);
        const aprobadas = formatted.filter(q => q.aprobada);

        // Pendientes por fecha de creación (primero las más nuevas)
        pendientes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Aprobadas ordenadas por Likes y luego por fecha
        aprobadas.sort((a, b) => b.likes - a.likes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setPreguntasPendientes(pendientes);
        setPreguntasAprobadas(aprobadas);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNube = async () => {
    try {
      const { data, error } = await supabase
        .from("eventos_nube_palabras")
        .select("palabra")
        .eq("evento_id", evento.id);

      if (data && !error) {
        // Agrupar y contar frecuencia de palabras
        const freq: Record<string, number> = {};
        data.forEach((d: any) => {
          const pal = d.palabra.toUpperCase().trim();
          freq[pal] = (freq[pal] || 0) + 1;
        });

        const formatted = Object.entries(freq).map(([palabra, cantidad]) => ({
          palabra,
          cantidad
        }));

        // Ordenar de mayor a menor frecuencia
        formatted.sort((a, b) => b.cantidad - a.cantidad);
        setPalabrasNube(formatted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- LÓGICA DE CONTROL DEL ORADOR (SWITCHES + MODO PROYECCIÓN) ---

  const handleToggleHerramienta = async (key: keyof HerramientasActivas & string) => {
    console.log("[TOGGLE] clicked", key, "current ha:", JSON.stringify(evento.herramientas_activas));

    if (!evento.id) {
      console.error("[TOGGLE] evento.id is falsy");
      return;
    }

    const nuevas = {
      ...evento.herramientas_activas,
      [key]: !evento.herramientas_activas[key],
    }

    console.log("[TOGGLE] nuevas:", JSON.stringify(nuevas));

    const { error } = await supabase
      .from("eventos")
      .update({ herramientas_activas: nuevas })
      .eq("id", evento.id);

    if (!error) {
      setEvento(prev => ({ ...prev, herramientas_activas: nuevas }));
    } else {
      console.error("[TOGGLE] error:", JSON.stringify(error));
      alert("Error al actualizar las herramientas activas.");
    }
  };

  const handleSetModoPantalla = async (modo: ModoPantalla) => {
    const { error } = await supabase
      .from("eventos")
      .update({ modo_pantalla_gigante: modo })
      .eq("id", evento.id);

    if (!error) {
      setEvento(prev => ({ ...prev, modo_pantalla_gigante: modo }));
    } else {
      alert("Error al cambiar el modo de pantalla.");
    }
  };

  const handleCopyLink = () => {
    const siteUrl = window.location.origin;
    const fullUrl = `${siteUrl}/eventos/${evento.slug_qr}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // --- LÓGICA DE GESTIÓN DE ENCUESTAS ---

  const handleAddOpcionField = () => {
    if (encuestaNuevaOpciones.length >= 6) return;
    setEncuestaNuevaOpciones([...encuestaNuevaOpciones, ""]);
  };

  const handleRemoveOpcionField = (idx: number) => {
    if (encuestaNuevaOpciones.length <= 2) return;
    setEncuestaNuevaOpciones(encuestaNuevaOpciones.filter((_, i) => i !== idx));
  };

  const handleOpcionChange = (idx: number, val: string) => {
    const updated = [...encuestaNuevaOpciones];
    updated[idx] = val;
    setEncuestaNuevaOpciones(updated);
  };

  const handleCreateEncuesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encuestaNuevaPregunta.trim()) return;

    const filtradas = encuestaNuevaOpciones.map(o => o.trim()).filter(o => o !== "");
    if (filtradas.length < 2) {
      alert("Debés rellenar al menos 2 opciones de respuesta.");
      return;
    }

    setEncuestaSubmitting(true);
    try {
      // 1. Insertar Encuesta
      const { data: poll, error: pollError } = await supabase
        .from("eventos_encuestas")
        .insert({
          evento_id: evento.id,
          pregunta: encuestaNuevaPregunta.trim(),
          activa: false
        })
        .select()
        .single();

      if (pollError || !poll) {
        alert("Error al crear la encuesta.");
        setEncuestaSubmitting(false);
        return;
      }

      // 2. Insertar Opciones
      const opcionesPayload = filtradas.map(texto => ({
        encuesta_id: poll.id,
        texto_opcion: texto
      }));

      const { error: optError } = await supabase
        .from("eventos_encuestas_opciones")
        .insert(opcionesPayload);

      if (!optError) {
        setEncuestaNuevaPregunta("");
        setEncuestaNuevaOpciones(["", ""]);
        fetchEncuestas();
      } else {
        alert("Error al crear las opciones.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEncuestaSubmitting(false);
    }
  };

  const handleLanzarEncuesta = async (pollId: string) => {
    const nuevasHerramientas = {
      ...evento.herramientas_activas,
      encuestas: true,
    }

    const { error: patchEventError } = await supabase
      .from("eventos")
      .update({
        encuesta_activa_id: pollId,
        modo_pantalla_gigante: "encuestas",
        herramientas_activas: nuevasHerramientas,
      })
      .eq("id", evento.id);

    if (!patchEventError) {
      setEvento(prev => ({
        ...prev,
        encuesta_activa_id: pollId,
        modo_pantalla_gigante: "encuestas",
        herramientas_activas: nuevasHerramientas,
      }));
      alert("¡Encuesta lanzada en vivo! La pantalla gigante muestra los resultados.");
      fetchEncuestas();
    } else {
      alert("Error al lanzar la encuesta.");
    }
  };

  const handleCerrarEncuestaActiva = async () => {
    const { error } = await supabase
      .from("eventos")
      .update({ encuesta_activa_id: null })
      .eq("id", evento.id);

    if (!error) {
      setEvento(prev => ({ ...prev, encuesta_activa_id: null }));
      setVotosEncuesta({});
      setEncuestaActivaVotosCount(0);
      fetchEncuestas();
    }
  };

  const handleDeleteEncuesta = async (pollId: string) => {
    if (!confirm("¿Deseas eliminar esta encuesta definitivamente?")) return;

    // Si es la encuesta activa actual del evento, limpiarla primero en la cabecera
    if (evento.encuesta_activa_id === pollId) {
      await supabase.from("eventos").update({ encuesta_activa_id: null }).eq("id", evento.id);
      setEvento(prev => ({ ...prev, encuesta_activa_id: null }));
    }

    const { error } = await supabase
      .from("eventos_encuestas")
      .delete()
      .eq("id", pollId);

    if (!error) {
      fetchEncuestas();
    }
  };

  // --- LÓGICA DE MODERACIÓN DE PREGUNTAS ---

  const handleAprobarPregunta = async (id: string) => {
    const { error } = await supabase
      .from("eventos_preguntas")
      .update({ aprobada: true })
      .eq("id", id);

    if (!error) {
      fetchPreguntas();
    }
  };

  const handleRechazarPregunta = async (id: string) => {
    const { error } = await supabase
      .from("eventos_preguntas")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchPreguntas();
    }
  };

  // --- LÓGICA DE NUBE DE IDEAS ---

  const handleReiniciarNube = async () => {
    if (!confirm("¿Estás seguro de que deseas vaciar y reiniciar por completo la Nube de Ideas para este evento presencial?")) {
      return;
    }

    const { error } = await supabase
      .from("eventos_nube_palabras")
      .delete()
      .eq("evento_id", evento.id);

    if (!error) {
      setPalabrasNube([]);
    } else {
      alert("Error al vaciar la nube.");
    }
  };

  const handleResetSemaforo = async () => {
    if (!confirm("¿Reiniciar el semáforo? Se borrarán todos los votos registrados hasta ahora.")) return;

    setResetSemaforoLoading(true);
    const { error } = await supabase
      .from("eventos")
      .update({ semaforo_last_reset_at: new Date().toISOString() })
      .eq("id", evento.id);

    if (!error) {
      setEstadoSemaforo(null);
      setResetSemaforoLoading(false);
    } else {
      alert("Error al reiniciar el semáforo.");
      setResetSemaforoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header con Información de Proyección */}
      <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-xl">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-0.5 rounded-md">
              Panel Vivo
            </span>
            <span className="text-[10px] font-bold text-zinc-550 flex items-center gap-1">
              <Users size={12} className="text-zinc-550 shrink-0" />
              {asistentesCount} {asistentesCount === 1 ? "Acreditado" : "Acreditados"}
            </span>
          </div>

          <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
            {evento.nombre_evento}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-400 font-extrabold tracking-wide">
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                copiedLink 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-zinc-950/50 text-indigo-400 border-zinc-850 hover:bg-zinc-900"
              }`}
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              {copiedLink ? "Link Asistente Copiado" : "Copiar Link de Asistente"}
            </button>
            
            <a 
              href={`/eventos/${evento.slug_qr}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-850 rounded-xl transition-all"
            >
              <ExternalLink size={13} />
              Ver Vista Asistente
            </a>
          </div>
        </div>

        {/* 2. Panel de Control: Switches individuales + selector de proyección */}
        <div className="space-y-3 min-w-[280px]">
          {/* Toggle switches por herramienta */}
          <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-3xl space-y-3">
            <h3 className="text-[10px] uppercase font-black text-zinc-400 tracking-wider text-center flex items-center gap-1 justify-center">
              <ToggleLeft size={11} className="text-indigo-400" /> Herramientas Activas en Celulares
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'encuestas' as const, label: 'Encuestas', icon: Vote },
                { key: 'preguntas' as const, label: 'Muro Q&A', icon: MessageSquare },
                { key: 'nube' as const, label: 'Nube', icon: Cloud },
                { key: 'semaforo' as const, label: 'Semáforo', icon: TrafficCone },
              ]).map(({ key, label, icon: Icon }) => {
                const isOn = evento.herramientas_activas[key]
                return (
                  <button
                    key={key}
                    onClick={() => handleToggleHerramienta(key)}
                    className={`flex items-center gap-2 py-2.5 px-3 rounded-2xl transition-all cursor-pointer border text-left ${
                      isOn
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={isOn ? `Desactivar ${label}` : `Activar ${label}`}
                  >
                    <Icon size={16} className={isOn ? 'text-indigo-400' : 'text-zinc-600'} />
                    <span className="flex-1 text-[9px] uppercase tracking-wider font-extrabold">{label}</span>
                    <span className={`relative w-9 h-5 rounded-full transition-all ${
                      isOn
                        ? 'bg-indigo-500 shadow-sm shadow-indigo-500/40'
                        : 'bg-zinc-800'
                    }`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        isOn ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selector de modo de proyección */}
          <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-3xl space-y-3">
            <h3 className="text-[10px] uppercase font-black text-zinc-400 tracking-wider text-center flex items-center gap-1 justify-center">
              <Monitor size={11} className="text-indigo-400" /> Modo Pantalla Gigante
            </h3>
            <div className="flex gap-1.5">
              {([
                { key: 'bienvenida' as const, label: 'Bienvenida', icon: Sparkles },
                { key: 'nube' as const, label: 'Nube', icon: Cloud },
                { key: 'encuestas' as const, label: 'Encuestas', icon: Vote },
                { key: 'preguntas' as const, label: 'Preguntas', icon: MessageSquare },
              ]).map(({ key, label, icon: Icon }) => {
                const isModoActivo = evento.modo_pantalla_gigante === key
                const toolKey = key as keyof HerramientasActivas
                const toolEstaActiva = key === 'bienvenida' || evento.herramientas_activas[toolKey]
                return (
                  <button
                    key={key}
                    onClick={() => handleSetModoPantalla(key)}
                    className={`flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-all cursor-pointer border text-center relative ${
                      isModoActivo
                        ? "bg-indigo-600 border-indigo-500 text-white font-black scale-[1.03] shadow-md shadow-indigo-500/10"
                        : toolEstaActiva
                          ? "bg-zinc-900/40 border-zinc-800 text-zinc-550 hover:text-zinc-300"
                          : "bg-zinc-950/30 border-zinc-900 text-zinc-700 hover:text-zinc-500"
                    }`}
                    title={`${toolEstaActiva ? `Mostrar ${label} en el proyector` : `Activá "${label}" en herramientas primero`}`}
                  >
                    <Icon size={16} className="mb-1" />
                    <span className="text-[7px] uppercase tracking-wider font-extrabold">{label}</span>
                    {!toolEstaActiva && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <span className="text-[6px] text-amber-400 font-black">!</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TABS DE GESTIÓN INTERNA */}
      <nav className="flex bg-zinc-900/20 border border-zinc-850 p-1 rounded-2xl max-w-md">
        <button
          onClick={() => setPanelTab("herramientas")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            panelTab === "herramientas" 
              ? "bg-indigo-600 text-white shadow-md" 
              : "text-zinc-450 hover:text-zinc-200"
          }`}
        >
          <Vote size={15} />
          Encuestas
        </button>

        <button
          onClick={() => setPanelTab("moderacion")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            panelTab === "moderacion" 
              ? "bg-indigo-600 text-white shadow-md" 
              : "text-zinc-450 hover:text-zinc-200"
          }`}
        >
          <MessageSquare size={15} />
          Preguntas ({preguntasPendientes.length})
        </button>

        <button
          onClick={() => setPanelTab("nube")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            panelTab === "nube" 
              ? "bg-indigo-600 text-white shadow-md" 
              : "text-zinc-450 hover:text-zinc-200"
          }`}
        >
          <Cloud size={15} />
          Nube ({palabrasNube.length})
        </button>

        {evento.herramientas_activas.semaforo && (
          <button
            onClick={() => setPanelTab("semaforo")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              panelTab === "semaforo" 
                ? "bg-indigo-600 text-white shadow-md" 
                : "text-zinc-450 hover:text-zinc-200"
            }`}
          >
            <TrafficCone size={15} />
            Semáforo
          </button>
        )}
      </nav>

      {/* CONTENIDO GESTIONADO POR TABS */}
      <div className="space-y-6">
        
        {/* --- PESTAÑA A: ENCUESTAS --- */}
        {panelTab === "herramientas" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Creador de Encuesta */}
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 shadow-xl space-y-4 lg:col-span-1 h-fit">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={16} className="text-indigo-400" /> Crear Nueva Encuesta
                </h3>
                <p className="text-[10px] text-zinc-550">Agrega una pregunta e introduce las opciones de opción múltiple.</p>
              </div>

              <form onSubmit={handleCreateEncuesta} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-455 block px-1">Pregunta de la Encuesta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ¿Qué lenguaje usás más para IA?"
                    value={encuestaNuevaPregunta}
                    onChange={(e) => setEncuestaNuevaPregunta(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder-zinc-650 focus:outline-none transition-colors text-xs h-[42px]"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-455 block">Opciones de Respuesta</label>
                    {encuestaNuevaOpciones.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddOpcionField}
                        className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                      >
                        + Agregar Opción
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    {encuestaNuevaOpciones.map((opc, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[9px] font-black text-zinc-600 select-none w-3">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          required={idx < 2}
                          placeholder={idx < 2 ? `Opción obligatoria` : `Opción opcional`}
                          value={opc}
                          onChange={(e) => handleOpcionChange(idx, e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-indigo-500/50 rounded-xl text-white placeholder-zinc-650 focus:outline-none transition-colors text-xs h-[38px]"
                        />
                        {encuestaNuevaOpciones.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOpcionField(idx)}
                            className="p-2 text-zinc-600 hover:text-rose-400 transition-all cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={encuestaSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.97] cursor-pointer h-[44px]"
                >
                  {encuestaSubmitting ? (
                    <span className="animate-pulse">Guardando...</span>
                  ) : (
                    <>
                      <Plus size={14} />
                      Crear y Guardar Encuesta
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Listado y Visualización Activa */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Resultados Activos en Vivo */}
              {evento.encuesta_activa_id && (
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                  
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 px-2 py-0.5 rounded">
                        EN VIVO EN EL AUDITORIO
                      </span>
                      <h4 className="text-sm font-extrabold text-white pt-1">
                        Resultados en Tiempo Real
                      </h4>
                    </div>

                    <button
                      onClick={handleCerrarEncuestaActiva}
                      className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-all"
                    >
                      Cerrar Votación
                    </button>
                  </div>

                  {/* Detalle de Encuesta Activa */}
                  {encuestas.find(e => e.id === evento.encuesta_activa_id) && (
                    <div className="space-y-4 pt-1">
                      <h5 className="text-base font-black text-white">
                        {encuestas.find(e => e.id === evento.encuesta_activa_id)?.pregunta}
                      </h5>

                      <div className="space-y-3.5">
                        {encuestas.find(e => e.id === evento.encuesta_activa_id)?.opciones.map(opc => {
                          const total = encuestaActivaVotosCount;
                          const votos = votosEncuesta[opc.id] || 0;
                          const pct = total > 0 ? Math.round((votos / total) * 100) : 0;

                          return (
                            <div key={opc.id} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-zinc-350">
                                <span>{opc.texto_opcion}</span>
                                <span className="text-indigo-400">{pct}% <span className="text-zinc-650">({votos} {votos === 1 ? "voto" : "votos"})</span></span>
                              </div>
                              <div className="w-full bg-zinc-950 border border-zinc-900 h-3.5 rounded-full overflow-hidden relative">
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-550 font-bold">
                        <Users size={12} />
                        Total de Votos Registrados: {encuestaActivaVotosCount}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de Encuestas Guardadas */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">
                  Repositorio de Encuestas del Evento
                </h4>

                <div className="space-y-3">
                  {encuestas.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                      <Vote size={24} className="mx-auto text-zinc-700" />
                      <p className="text-[11px] font-bold text-zinc-500">No hay encuestas guardadas para este evento presencial.</p>
                    </div>
                  ) : (
                    encuestas.map(enc => (
                      <div 
                        key={enc.id}
                        className={`bg-zinc-900/20 border rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                          evento.encuesta_activa_id === enc.id
                            ? "border-cyan-500/40 bg-cyan-950/5 shadow-md shadow-cyan-500/5"
                            : "border-zinc-850"
                        }`}
                      >
                        <div className="space-y-1.5 max-w-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-500">
                              {enc.opciones.length} opciones
                            </span>
                            {evento.encuesta_activa_id === enc.id && (
                              <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 animate-pulse">
                                Activa en vivo
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-black text-zinc-200 leading-snug">
                            {enc.pregunta}
                          </h5>
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {enc.opciones.map(o => (
                              <span key={o.id} className="text-[9px] font-bold bg-zinc-950/40 text-zinc-500 border border-zinc-900 px-2 py-0.5 rounded">
                                {o.texto_opcion}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 md:self-center">
                          {evento.encuesta_activa_id !== enc.id ? (
                            <button
                              onClick={() => handleLanzarEncuesta(enc.id)}
                              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-[9px] uppercase tracking-wider py-2.5 px-4 rounded-xl shadow cursor-pointer transition-all"
                            >
                              <Play size={10} className="fill-white" />
                              Lanzar al Proyector
                            </button>
                          ) : (
                            <button
                              onClick={handleCerrarEncuestaActiva}
                              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 font-extrabold text-[9px] uppercase tracking-wider py-2.5 px-4 rounded-xl cursor-pointer transition-all"
                            >
                              Cerrar
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEncuesta(enc.id)}
                            className="p-2.5 bg-zinc-950/40 hover:bg-rose-500/10 border border-zinc-850 hover:border-rose-500/20 text-zinc-500 hover:text-rose-400 rounded-xl cursor-pointer transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA B: MODERACIÓN DE PREGUNTAS --- */}
        {panelTab === "moderacion" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Preguntas Pendientes */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1 flex justify-between items-center">
                <span>Cola de Aprobación Pendiente</span>
                <span className="text-[9px] bg-zinc-900 border border-zinc-850 px-2.5 py-0.5 rounded-full text-zinc-500">
                  {preguntasPendientes.length} por moderar
                </span>
              </h3>

              <div className="space-y-3">
                {preguntasPendientes.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                    <MessageSquare size={24} className="mx-auto text-zinc-700" />
                    <p className="text-[11px] font-bold text-zinc-500">Ninguna pregunta pendiente de moderación.</p>
                  </div>
                ) : (
                  preguntasPendientes.map((q) => (
                    <div 
                      key={q.id}
                      className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-4 flex justify-between items-start gap-4 shadow"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded">
                            {q.nombre}
                          </span>
                          <span className="text-[8px] text-zinc-550">
                            {new Date(q.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-white leading-relaxed">
                          "{q.pregunta}"
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-center">
                        <button
                          onClick={() => handleAprobarPregunta(q.id)}
                          className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl cursor-pointer transition-all"
                          title="Aprobar para el muro"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleRechazarPregunta(q.id)}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-450 rounded-xl cursor-pointer transition-all"
                          title="Rechazar y borrar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Muro Aprobado */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1 flex justify-between items-center">
                <span>Muro en Proyector (Aprobadas)</span>
                <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-400">
                  {preguntasAprobadas.length} en pantalla
                </span>
              </h3>

              <div className="space-y-3">
                {preguntasAprobadas.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                    <TrendingUp size={24} className="mx-auto text-zinc-700" />
                    <p className="text-[11px] font-bold text-zinc-500">Aún no hay preguntas aprobadas en el muro en vivo.</p>
                  </div>
                ) : (
                  preguntasAprobadas.map((q, idx) => (
                    <div 
                      key={q.id}
                      className="bg-zinc-900/30 border border-zinc-850 rounded-3xl p-4 flex justify-between items-start gap-4 shadow relative"
                    >
                      {idx === 0 && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-3xl" />
                      )}

                      <div className="space-y-1.5 flex-1 pl-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded">
                            {q.nombre}
                          </span>
                          {idx === 0 && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 flex items-center gap-0.5 shrink-0">
                              Top 1
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-zinc-200 leading-relaxed">
                          "{q.pregunta}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-center">
                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
                          👍 {q.likes}
                        </span>
                        <button
                          onClick={() => handleRechazarPregunta(q.id)}
                          className="p-2 text-zinc-600 hover:text-rose-400 transition-all cursor-pointer"
                          title="Remover de pantalla"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA C: NUBE DE IDEAS --- */}
        {panelTab === "nube" && (
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Nube de Ideas y Aprendizaje
                </h3>
                <p className="text-[10px] text-zinc-550">Compilación de conceptos y palabras aportadas en vivo por los participantes del auditorio.</p>
              </div>

              {palabrasNube.length > 0 && (
                <button
                  onClick={handleReiniciarNube}
                  className="text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-all"
                >
                  Reiniciar Nube
                </button>
              )}
            </div>

            {/* Visualización Simple de Conceptos y Frecuencias */}
            {palabrasNube.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                <Cloud size={32} className="mx-auto text-zinc-700" />
                <p className="text-[11px] font-bold text-zinc-500">Ninguna palabra clave aportada aún por la audiencia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Canvas de Tag Cloud de Frecuencia */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-6 min-h-[160px] flex flex-wrap items-center justify-center gap-4 relative">
                  <div className="absolute top-3 left-4 text-[8px] font-black tracking-widest text-indigo-400 uppercase">Proyección Colectiva</div>
                  
                  {palabrasNube.map((pal, idx) => {
                    // Generar diferentes tamaños según su frecuencia
                    const maxQty = palabrasNube[0]?.cantidad || 1;
                    const sizeScale = 0.8 + (pal.cantidad / maxQty) * 1.4; // Multiplicador de escala font-size
                    const opacityScale = 0.5 + (pal.cantidad / maxQty) * 0.5;

                    return (
                      <span 
                        key={idx}
                        className="inline-block uppercase tracking-wide font-black transition-all bg-indigo-500/[0.03] hover:bg-indigo-500/[0.08] border border-zinc-900 px-3.5 py-1.5 rounded-2xl cursor-default"
                        style={{ 
                          fontSize: `${sizeScale}rem`,
                          opacity: opacityScale,
                          color: idx === 0 ? "#fbbf24" : idx === 1 ? "#22d3ee" : idx === 2 ? "#60a5fa" : "#f1f5f9"
                        }}
                      >
                        {pal.palabra} <span className="text-[9px] text-zinc-600 font-normal">({pal.cantidad})</span>
                      </span>
                    );
                  })}
                </div>

                {/* Listado Desglosado con Frecuencia */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-widest px-1">Frecuencia de Conceptos Recibidos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {palabrasNube.map((pal, idx) => (
                      <div 
                        key={idx}
                        className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-3 flex justify-between items-center"
                      >
                        <span className="text-xs font-extrabold uppercase tracking-wide text-zinc-200">
                          {pal.palabra}
                        </span>
                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                          {pal.cantidad} {pal.cantidad === 1 ? "concepto" : "conceptos"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PESTAÑA D: SEMÁFORO --- */}
        {panelTab === "semaforo" && (
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrafficCone size={16} className="text-amber-400" /> Semáforo de Comprensión
                </h3>
                <p className="text-[10px] text-zinc-550">
                  Monitoreá en tiempo real la comprensión del auditorio. Los asistentes votan si van al ritmo de la explicación.
                </p>
              </div>
            </div>

            {/* Estado actual del semáforo */}
            {estadoSemaforo && (
              <div className="grid grid-cols-3 gap-4">
                <div className={`rounded-3xl p-5 text-center border transition-all ${
                  estadoSemaforo.estado === 'VERDE'
                    ? 'bg-emerald-500/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10 scale-105'
                    : 'bg-zinc-950/40 border-zinc-800 opacity-40'
                }`}>
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 ${
                    estadoSemaforo.estado === 'VERDE' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 animate-pulse' : 'bg-zinc-700'
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Verde</span>
                </div>
                <div className={`rounded-3xl p-5 text-center border transition-all ${
                  estadoSemaforo.estado === 'AMARILLO'
                    ? 'bg-yellow-500/20 border-yellow-500/40 shadow-lg shadow-yellow-500/10 scale-105'
                    : 'bg-zinc-950/40 border-zinc-800 opacity-40'
                }`}>
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 ${
                    estadoSemaforo.estado === 'AMARILLO' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30 animate-pulse' : 'bg-zinc-700'
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">Amarillo</span>
                </div>
                <div className={`rounded-3xl p-5 text-center border transition-all ${
                  estadoSemaforo.estado === 'ROJO'
                    ? 'bg-rose-500/20 border-rose-500/40 shadow-lg shadow-rose-500/10 scale-105'
                    : 'bg-zinc-950/40 border-zinc-800 opacity-40'
                }`}>
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 ${
                    estadoSemaforo.estado === 'ROJO' ? 'bg-rose-500 shadow-lg shadow-rose-500/30 animate-pulse' : 'bg-zinc-700'
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Rojo</span>
                </div>
              </div>
            )}

            {/* Métricas */}
            {estadoSemaforo && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-2xl font-black text-white">{estadoSemaforo.totalAcreditados}</span>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Acreditados</p>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-2xl font-black text-rose-400">{estadoSemaforo.votosNegativos}</span>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Votos Negativos</p>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 text-center space-y-1">
                  <span className={`text-2xl font-black ${
                    estadoSemaforo.porcentajeNegativo < 30 ? 'text-emerald-400' : estadoSemaforo.porcentajeNegativo < 50 ? 'text-yellow-400' : 'text-rose-400'
                  }`}>{estadoSemaforo.porcentajeNegativo}%</span>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Negativos</p>
                </div>
              </div>
            )}

            {/* Botón de reseteo */}
            <div className="flex justify-center">
              <button
                onClick={handleResetSemaforo}
                disabled={resetSemaforoLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={resetSemaforoLoading ? 'animate-spin' : ''} />
                {resetSemaforoLoading ? 'Reiniciando...' : 'Reiniciar Semáforo'}
              </button>
            </div>

            {/* Sin datos todavía */}
            {!estadoSemaforo && (
              <div className="text-center py-12 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                <TrafficCone size={28} className="mx-auto text-zinc-700" />
                <p className="text-[11px] font-bold text-zinc-500">No hay datos del semáforo aún.</p>
                <p className="text-[10px] text-zinc-600">Esperá a que los asistentes comiencen a votar.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
