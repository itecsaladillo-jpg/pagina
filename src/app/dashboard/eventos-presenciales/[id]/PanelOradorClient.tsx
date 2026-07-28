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
  ToggleLeft,
  Monitor,
  RefreshCw,
  Radio,
  BarChart3,
  Activity,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { resetearSemaforo } from "../semaforoActions";

interface HerramientasActivas {
  encuestas: boolean;
  preguntas: boolean;
  nube: boolean;
  semaforo: boolean;
}

type EstadoSemaforo = 'verde' | 'amarillo' | 'rojo';

interface SemaforoState {
  totalAcreditados: number;
  votosNegativos: number;
  porcentajeNegativo: number;
  estado: EstadoSemaforo;
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

  // Estados del Semáforo de Comprensión
  const [semaforoState, setSemaforoState] = useState<SemaforoState>({
    totalAcreditados: 0,
    votosNegativos: 0,
    porcentajeNegativo: 0,
    estado: 'verde',
  });
  const [semaforoLastReset, setSemaforoLastReset] = useState<string | null>(null);
  const [semaforoResetting, setSemaforoResetting] = useState(false);
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

  // Ref + estado para escala 1:1 del preview de pantalla gigante
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

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

    const refreshVotosLocal = async () => {
      const { data: optionsData } = await supabase
        .from("eventos_encuestas_opciones")
        .select("id")
        .eq("encuesta_id", evento.encuesta_activa_id);

      const opcionesIds = (optionsData || []).map(o => o.id);
      if (opcionesIds.length === 0) return;

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

  // 4b. Suscripción Realtime a la lista de Encuestas (crear/eliminar)
  useEffect(() => {
    if (!evento?.id) return;

    const encuestasChannel = supabase
      .channel(`realtime:orador_encuestas_${evento.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "eventos_encuestas",
          filter: `evento_id=eq.${evento.id}`
        },
        () => {
          fetchEncuestas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(encuestasChannel);
    };
  }, [evento?.id, supabase]);

  // 4c. Suscripción Realtime al Semáforo de Comprensión
  useEffect(() => {
    if (!evento?.id) return;

    // Cargar el último semaforo_last_reset_at y calcular estado inicial
    const cargarSemaforo = async () => {
      const { data: eventoData } = await supabase
        .from('eventos')
        .select('semaforo_last_reset_at')
        .eq('id', evento.id)
        .single();

      const resetAt = eventoData?.semaforo_last_reset_at ?? new Date(0).toISOString();
      setSemaforoLastReset(resetAt);

      recalcularSemaforo(resetAt);
    };

    cargarSemaforo();

    // Escuchar nuevos votos del semáforo
    const semaforoVotosChannel = supabase
      .channel(`realtime:orador_semaforo_votos_${evento.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'evento_semaforo_votos',
          filter: `evento_id=eq.${evento.id}`,
        },
        () => {
          setSemaforoState(prev => {
            const nuevosVotos = prev.votosNegativos + 1;
            const pct = prev.totalAcreditados > 0
              ? Math.round((nuevosVotos / prev.totalAcreditados) * 100)
              : 0;
            return {
              ...prev,
              votosNegativos: nuevosVotos,
              porcentajeNegativo: pct,
              estado: calcularEstadoLocal(pct),
            };
          });
        }
      )
      .subscribe();

    // Escuchar resets (cambio de semaforo_last_reset_at en eventos)
    const semaforoResetChannel = supabase
      .channel(`realtime:orador_semaforo_reset_${evento.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'eventos',
          filter: `id=eq.${evento.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData?.semaforo_last_reset_at) {
            const nuevoReset = newData.semaforo_last_reset_at;
            setSemaforoLastReset(nuevoReset);
            recalcularSemaforo(nuevoReset);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(semaforoVotosChannel);
      supabase.removeChannel(semaforoResetChannel);
    };
  }, [evento?.id, supabase]);

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

  // --- HELPERS DEL SEMÁFORO ---

  const calcularEstadoLocal = (pct: number): EstadoSemaforo => {
    if (pct >= 50) return 'rojo';
    if (pct >= 30) return 'amarillo';
    return 'verde';
  };

  const recalcularSemaforo = async (resetAt: string) => {
    const total = asistentesCount;

    const { count: votos } = await supabase
      .from('evento_semaforo_votos')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', evento.id)
      .gte('created_at', resetAt);

    const votosNegativos = votos ?? 0;
    const porcentajeNegativo = total > 0 ? Math.round((votosNegativos / total) * 100) : 0;
    const estado = calcularEstadoLocal(porcentajeNegativo);

    setSemaforoState({ totalAcreditados: total, votosNegativos, porcentajeNegativo, estado });
  };

  const handleResetearSemaforo = async () => {
    if (!confirm('¿Reiniciar el semáforo? Los votos anteriores dejarán de contarse.')) return;

    setSemaforoResetting(true);
    try {
      const result = await resetearSemaforo(evento.id);
      if (!result.success) {
        alert(result.error || 'Error al reiniciar el semáforo.');
      }
      // El estado se actualizará vía Realtime (semaforoResetChannel)
    } catch (err) {
      console.error('[handleResetearSemaforo]', err);
      alert('Error inesperado al reiniciar el semáforo.');
    } finally {
      setSemaforoResetting(false);
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

  // ResizeObserver para escalar el iframe 1920x1080 al ancho del contenedor
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;

    const calcScale = () => {
      const w = el.clientWidth;
      setPreviewScale(Math.min(w / 1920, 1));
    };

    calcScale();
    const ro = new ResizeObserver(calcScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toolMeta = [
    { key: 'encuestas' as const, label: 'Encuestas', icon: Vote },
    { key: 'preguntas' as const, label: 'Preguntas', icon: MessageSquare },
    { key: 'nube' as const, label: 'Nube', icon: Cloud },
    { key: 'semaforo' as const, label: 'Semáforo', icon: Activity },
  ];

  const modoLabel: Record<string, string> = {
    bienvenida: 'Bienvenida',
    encuestas: 'Encuestas',
    preguntas: 'Preguntas',
    nube: 'Nube de Ideas',
    semaforo: 'Semáforo',
  };

  const toolColors: Record<string, { chip: string; chipTrack: string; active: string; hover: string; border: string; badge: string }> = {
    encuestas: { chip: 'bg-sky-500/15 border-sky-500/30 text-sky-400 shadow-sm', chipTrack: 'bg-sky-500', active: 'bg-sky-600 border-sky-500', hover: 'hover:text-sky-400 hover:border-sky-600', border: 'border-sky-500/40', badge: 'text-sky-400 bg-sky-950/40 border-sky-900/50' },
    preguntas: { chip: 'bg-violet-500/15 border-violet-500/30 text-violet-400 shadow-sm', chipTrack: 'bg-violet-500', active: 'bg-violet-600 border-violet-500', hover: 'hover:text-violet-400 hover:border-violet-600', border: 'border-violet-500/40', badge: 'text-violet-400 bg-violet-950/40 border-violet-900/50' },
    nube: { chip: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm', chipTrack: 'bg-emerald-500', active: 'bg-emerald-600 border-emerald-500', hover: 'hover:text-emerald-400 hover:border-emerald-600', border: 'border-emerald-500/40', badge: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50' },
    semaforo: { chip: 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-sm', chipTrack: 'bg-rose-500', active: 'bg-rose-600 border-rose-500', hover: 'hover:text-rose-400 hover:border-rose-600', border: 'border-rose-500/40', badge: 'text-rose-400 bg-rose-950/40 border-rose-900/50' },
  };

  return (
    <div className="space-y-6">

      {/* ================================================================ */}
      {/* SECTION 1: HEADER + RESÚMEN HERRAMIENTAS + VISTA PREVIA BIG SCREEN */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* --- COL IZQUIERDA: INFO + CHIPS (3/5) --- */}
        <div className="xl:col-span-3 space-y-4">

          {/* A. Título Evento + Badge + Acciones */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 backdrop-blur-sm relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded-md">
                    <Radio size={10} className="text-indigo-400" /> Consola ITEC
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2.5 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                    EN VIVO
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 bg-zinc-950/40 border border-zinc-800 px-2.5 py-1 rounded-md">
                    <Users size={11} className="text-zinc-500" />
                    {asistentesCount} {asistentesCount === 1 ? 'Acreditado' : 'Acreditados'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                  {evento.nombre_evento}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-950/50 text-indigo-400 border-zinc-850 hover:bg-zinc-900'
                  }`}
                  title="Copiar link de asistente"
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                  <span className="hidden sm:inline text-[9px] font-extrabold uppercase tracking-wider">{copiedLink ? 'Copiado' : 'Link Asistente'}</span>
                </button>
                <a
                  href={`/eventos/${evento.slug_qr}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-850 rounded-xl transition-all"
                  title="Ver vista asistente"
                >
                  <ExternalLink size={13} className="text-zinc-400" />
                  <span className="hidden sm:inline text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Asistente</span>
                </a>
              </div>
            </div>
          </div>

          {/* B. Resumen de Herramientas Activas en Celulares (chips compactos) */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center gap-1.5 mb-3">
              <ToggleLeft size={11} className="text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Herramientas Activas en Celulares</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {toolMeta.map(({ key, label, icon: Icon }) => {
                const isOn = evento.herramientas_activas[key]
                const c = toolColors[key]
                return (
                  <button
                    key={key}
                    onClick={() => handleToggleHerramienta(key)}
                    className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border transition-all cursor-pointer text-[10px] font-extrabold uppercase tracking-wider ${
                      isOn ? c.chip : 'bg-zinc-950/40 border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'
                    }`}
                    title={`${isOn ? 'Desactivar' : 'Activar'} ${label}`}
                  >
                    <Icon size={12} />
                    {label}
                    <span className={`relative w-7 h-3.5 rounded-full transition-all ${
                      isOn ? c.chipTrack : 'bg-zinc-700'
                    }`}>
                      <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${
                        isOn ? 'translate-x-3.5' : 'translate-x-0'
                      }`} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* --- COL DERECHA: VISTA PREVIA PANTALLA GIGANTE (2/5) --- */}
        <div className="xl:col-span-2">
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-4 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Monitor size={11} className="text-indigo-400" />
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">En Pantalla Gigante</span>
              </div>
              {(() => {
                const modo = evento.modo_pantalla_gigante
                const c = modo !== 'bienvenida' ? toolColors[modo] : null
                return (
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    c ? c.badge : 'text-zinc-500 bg-zinc-950/40 border-zinc-800'
                  }`}>
                    {modoLabel[modo] || modo}
                  </span>
                )
              })()}
            </div>

            {/* Live Preview — miniatura a escala fiel 1:1 de la pantalla gigante */}
            <div
              ref={previewContainerRef}
              className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 pointer-events-none"
              style={{ aspectRatio: '16 / 9' }}
            >
              <div
                style={{
                  width: 1920,
                  height: 1080,
                  transformOrigin: 'top left',
                  transform: `scale(${previewScale})`,
                }}
              >
                <iframe
                  key={evento.modo_pantalla_gigante}
                  src={`/eventos/${evento.slug_qr}/pantalla`}
                  width={1920}
                  height={1080}
                  title="Vista previa de la pantalla gigante"
                  className="border-0"
                  scrolling="no"
                />
              </div>
            </div>

            {/* Selector de modo directo */}
            <div className="flex gap-1 mt-3">
              {([
                { key: 'bienvenida' as const, label: 'Bienvenida', icon: Sparkles },
                { key: 'nube' as const, label: 'Nube', icon: Cloud },
                { key: 'encuestas' as const, label: 'Encuestas', icon: Vote },
                { key: 'preguntas' as const, label: 'Preguntas', icon: MessageSquare },
                { key: 'semaforo' as const, label: 'Semáforo', icon: Activity },
              ]).map(({ key, label, icon: Icon }) => {
                const isModoActivo = evento.modo_pantalla_gigante === key
                const c = toolColors[key] || { active: 'bg-zinc-600 border-zinc-500', hover: 'hover:text-zinc-300 hover:border-zinc-600' }
                return (
                  <button
                    key={key}
                    onClick={() => handleSetModoPantalla(key)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-xl border transition-all cursor-pointer text-[7px] font-black uppercase tracking-wider ${
                      isModoActivo
                        ? c.active + ' text-white shadow-sm'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-600 ' + c.hover
                    }`}
                  >
                    <Icon size={11} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 2: NAVEGACIÓN POR PESTAÑAS (Tabs) */}
      {/* ================================================================ */}
      <nav className="flex bg-zinc-900/20 border border-zinc-850 p-1 rounded-2xl">
        {([
          { key: 'herramientas' as const, label: 'Encuestas', tabIcon: BarChart3, count: null },
          { key: 'moderacion' as const, label: 'Preguntas', tabIcon: MessageSquare, count: preguntasPendientes.length },
          { key: 'nube' as const, label: 'Nube Ideas', tabIcon: Cloud, count: palabrasNube.length },
          { key: 'semaforo' as const, label: 'Semáforo', tabIcon: Activity, count: semaforoState.votosNegativos > 0 ? semaforoState.votosNegativos : null },
        ]).map(({ key, label, tabIcon: Icon, count }) => {
          const isActive = panelTab === key
          const c = toolColors[key === 'herramientas' ? 'encuestas' : key === 'moderacion' ? 'preguntas' : key as keyof typeof toolColors]
          return (
            <button
              key={key}
              onClick={() => setPanelTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative ${
                isActive
                  ? c.active + ' text-white shadow-md'
                  : 'text-zinc-450 ' + c.hover
              }`}
            >
              <Icon size={15} />
              {label}
              {count !== null && count > 0 && (
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ================================================================ */}
      {/* SECTION 3: CONTENIDO GESTIONADO POR TABS */}
      {/* ================================================================ */}
      <div className="space-y-6">

        {/* --- PESTAÑA ENCUESTAS --- */}
        {panelTab === "herramientas" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Creador de Encuesta */}
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 shadow-xl space-y-4 lg:col-span-1 h-fit">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={16} className="text-sky-400" /> Crear Nueva Encuesta
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
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-sky-500/50 rounded-2xl text-white placeholder-zinc-650 focus:outline-none transition-colors text-xs h-[42px]"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-455 block">Opciones de Respuesta</label>
                    {encuestaNuevaOpciones.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddOpcionField}
                        className="text-[9px] font-black uppercase text-sky-400 hover:text-sky-300 transition-all cursor-pointer"
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
                          className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-sky-500/50 rounded-xl text-white placeholder-zinc-650 focus:outline-none transition-colors text-xs h-[38px]"
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
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold text-[10px] uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.97] cursor-pointer h-[44px]"
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
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />

                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 bg-sky-950/40 border border-sky-900/50 px-2 py-0.5 rounded">
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
                                <span className="text-sky-400">{pct}% <span className="text-zinc-650">({votos} {votos === 1 ? "voto" : "votos"})</span></span>
                              </div>
                              <div className="w-full bg-zinc-950 border border-zinc-900 h-3.5 rounded-full overflow-hidden relative">
                                <div
                                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-500 to-sky-400 rounded-full transition-all duration-500"
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
                            ? "border-sky-500/40 bg-sky-950/5 shadow-md shadow-sky-500/5"
                            : "border-zinc-850"
                        }`}
                      >
                        <div className="space-y-1.5 max-w-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-500">
                              {enc.opciones.length} opciones
                            </span>
                            {evento.encuesta_activa_id === enc.id && (
                              <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/30 text-sky-400 animate-pulse">
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
                              className="flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold text-[9px] uppercase tracking-wider py-2.5 px-4 rounded-xl shadow cursor-pointer transition-all"
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

        {/* --- PESTAÑA PREGUNTAS --- */}
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
                      className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-4 flex justify-between items-start gap-4 shadow overflow-hidden"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2 py-0.5 rounded">
                            {q.nombre}
                          </span>
                          <span className="text-[8px] text-zinc-550">
                            {new Date(q.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-white leading-relaxed break-words whitespace-pre-wrap">
                          &quot;{q.pregunta}&quot;
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
            <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-2">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1 flex justify-between items-center">
                <span>Muro en Proyector (Aprobadas)</span>
                <span className="text-[9px] bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full text-violet-400">
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
                      className="bg-zinc-900/30 border border-zinc-850 rounded-3xl p-4 flex justify-between items-start gap-4 shadow relative w-[85%] mx-auto overflow-hidden"
                    >
                      {idx === 0 && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-violet-500 to-violet-700 rounded-l-3xl" />
                      )}

                      <div className="space-y-1.5 flex-1 pl-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2 py-0.5 rounded">
                            {q.nombre}
                          </span>
                          {idx === 0 && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 flex items-center gap-0.5 shrink-0">
                              Top 1
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
                          &quot;{q.pregunta}&quot;
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-center">
                        <span className="text-[10px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-xl">
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

        {/* --- PESTAÑA NUBE IDEAS --- */}
        {panelTab === "nube" && (
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

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

            {palabrasNube.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                <Cloud size={32} className="mx-auto text-zinc-700" />
                <p className="text-[11px] font-bold text-zinc-500">Ninguna palabra clave aportada aún por la audiencia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-6 min-h-[160px] flex flex-wrap items-center justify-center gap-4 relative">
                  <div className="absolute top-3 left-4 text-[8px] font-black tracking-widest text-emerald-400 uppercase">Proyección Colectiva</div>

                  {palabrasNube.map((pal, idx) => {
                    const maxQty = palabrasNube[0]?.cantidad || 1;
                    const sizeScale = 0.8 + (pal.cantidad / maxQty) * 1.4;
                    const opacityScale = 0.5 + (pal.cantidad / maxQty) * 0.5;

                    return (
                      <span
                        key={idx}
                        className="inline-block uppercase tracking-wide font-black transition-all bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08] border border-zinc-900 px-3.5 py-1.5 rounded-2xl cursor-default"
                        style={{
                          fontSize: `${sizeScale}rem`,
                          opacity: opacityScale,
                          color: idx === 0 ? "#10b981" : idx === 1 ? "#34d399" : idx === 2 ? "#6ee7b7" : "#f1f5f9"
                        }}
                      >
                        {pal.palabra} <span className="text-[9px] text-zinc-600 font-normal">({pal.cantidad})</span>
                      </span>
                    );
                  })}
                </div>

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
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {pal.cantidad} {pal.cantidad === 1 ? "concepto" : "conceptos"}
                        </span>
                      </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA PREGUNTAS --- */}
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
                      className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-4 flex justify-between items-start gap-4 shadow overflow-hidden"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2 py-0.5 rounded">
                            {q.nombre}
                          </span>
                          <span className="text-[8px] text-zinc-550">
                            {new Date(q.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-white leading-relaxed break-words whitespace-pre-wrap">
                          &quot;{q.pregunta}&quot;
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
            <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-2">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1 flex justify-between items-center">
                <span>Muro en Proyector (Aprobadas)</span>
                <span className="text-[9px] bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full text-violet-400">
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
                      className="bg-zinc-900/30 border border-zinc-850 rounded-3xl p-4 flex justify-between items-start gap-4 shadow relative w-[85%] mx-auto overflow-hidden"
                    >
                      {idx === 0 && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-violet-500 to-violet-700 rounded-l-3xl" />
                      )}

                      <div className="space-y-1.5 flex-1 pl-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2 py-0.5 rounded">
                            {q.nombre}
                          </span>
                          {idx === 0 && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 flex items-center gap-0.5 shrink-0">
                              Top 1
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
                          &quot;{q.pregunta}&quot;
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-center">
                        <span className="text-[10px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-xl">
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

        {/* --- PESTAÑA NUBE IDEAS --- */}
        {panelTab === "nube" && (
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

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

            {palabrasNube.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                <Cloud size={32} className="mx-auto text-zinc-700" />
                <p className="text-[11px] font-bold text-zinc-500">Ninguna palabra clave aportada aún por la audiencia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-6 min-h-[160px] flex flex-wrap items-center justify-center gap-4 relative">
                  <div className="absolute top-3 left-4 text-[8px] font-black tracking-widest text-emerald-400 uppercase">Proyección Colectiva</div>

                  {palabrasNube.map((pal, idx) => {
                    const maxQty = palabrasNube[0]?.cantidad || 1;
                    const sizeScale = 0.8 + (pal.cantidad / maxQty) * 1.4;
                    const opacityScale = 0.5 + (pal.cantidad / maxQty) * 0.5;

                    return (
                      <span
                        key={idx}
                        className="inline-block uppercase tracking-wide font-black transition-all bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08] border border-zinc-900 px-3.5 py-1.5 rounded-2xl cursor-default"
                        style={{
                          fontSize: `${sizeScale}rem`,
                          opacity: opacityScale,
                          color: idx === 0 ? "#10b981" : idx === 1 ? "#34d399" : idx === 2 ? "#6ee7b7" : "#f1f5f9"
                        }}
                      >
                        {pal.palabra} <span className="text-[9px] text-zinc-600 font-normal">({pal.cantidad})</span>
                      </span>
                    );
                  })}
                </div>

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
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
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

        {/* --- PESTAÑA SEMÁFORO --- */}
        {panelTab === "semaforo" && (() => {
          const { totalAcreditados, votosNegativos, porcentajeNegativo, estado } = semaforoState;
          const isSemaforoOn = evento.herramientas_activas.semaforo;

          const estadoConfig = {
            verde:    { label: 'VERDE',    dot: 'bg-emerald-500',  ring: 'ring-emerald-500/30',  text: 'text-emerald-400',  border: 'border-emerald-500/20',  bg: 'bg-emerald-500/10',   glow: 'shadow-emerald-500/20' },
            amarillo: { label: 'AMARILLO', dot: 'bg-amber-400',    ring: 'ring-amber-400/30',    text: 'text-amber-400',    border: 'border-amber-500/20',    bg: 'bg-amber-500/10',     glow: 'shadow-amber-500/20'   },
            rojo:     { label: 'ROJO',     dot: 'bg-rose-500',     ring: 'ring-rose-500/30',     text: 'text-rose-400',     border: 'border-rose-500/20',     bg: 'bg-rose-500/10',      glow: 'shadow-rose-500/20'    },
          };
          const ec = estadoConfig[estado];

          return (
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 shadow-xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded">
                    EN VIVO EN EL AUDITORIO
                  </span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <Activity size={15} className="text-rose-400" />
                    Semáforo de Comprensión
                  </h3>
                  <p className="text-[10px] text-zinc-550">
                    Los asistentes emiten alertas desde sus celulares cuando se pierden o no comprenden.
                  </p>
                </div>

                {isSemaforoOn && (
                  <button
                    id="btn-reiniciar-semaforo"
                    onClick={handleResetearSemaforo}
                    disabled={semaforoResetting}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RotateCcw size={11} className={semaforoResetting ? 'animate-spin' : ''} />
                    Reiniciar
                  </button>
                )}
              </div>

              {/* Si el semáforo está apagado */}
              {!isSemaforoOn && (
                <div className="text-center py-10 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-2">
                  <AlertTriangle size={28} className="mx-auto text-zinc-700" />
                  <p className="text-[11px] font-bold text-zinc-500">El semáforo está desactivado.</p>
                  <p className="text-[10px] text-zinc-600">Activalo usando el switch "Semáforo" de arriba para que los asistentes puedan enviar alertas.</p>
                </div>
              )}

              {/* Estado principal — visión en 3 columnas */}
              {isSemaforoOn && (
                <div className="grid grid-cols-3 gap-3">
                  {(['verde', 'amarillo', 'rojo'] as const).map((e) => {
                    const c = estadoConfig[e];
                    const isActive = estado === e;
                    return (
                      <div
                        key={e}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                          isActive
                            ? `${c.bg} ${c.border} shadow-lg ${c.glow}`
                            : 'bg-zinc-950/30 border-zinc-900'
                        }`}
                      >
                        <span className={`relative flex h-4 w-4 ${isActive ? '' : 'opacity-30'}`}>
                          {isActive && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-60`} />}
                          <span className={`relative inline-flex rounded-full h-4 w-4 ${c.dot}`} />
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? c.text : 'text-zinc-600'}`}>
                          {c.label}
                        </span>
                        {isActive && (
                          <span className={`text-[8px] font-bold ${c.text} bg-white/5 border ${c.border} px-2 py-0.5 rounded-full`}>
                            ESTADO ACTUAL
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Estadísticas */}
              {isSemaforoOn && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-3 text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Acreditados</p>
                    <p className="text-2xl font-black text-white">{totalAcreditados}</p>
                  </div>
                  <div className={`border rounded-2xl p-3 text-center space-y-1 ${ec.bg} ${ec.border}`}>
                    <p className={`text-[9px] font-black uppercase tracking-wider ${ec.text}`}>Alertas</p>
                    <p className={`text-2xl font-black ${ec.text}`}>{votosNegativos}</p>
                  </div>
                  <div className={`border rounded-2xl p-3 text-center space-y-1 ${ec.bg} ${ec.border}`}>
                    <p className={`text-[9px] font-black uppercase tracking-wider ${ec.text}`}>% Alerta</p>
                    <p className={`text-2xl font-black ${ec.text}`}>{porcentajeNegativo}%</p>
                  </div>
                </div>
              )}

              {/* Reglas de umbral */}
              {isSemaforoOn && (
                <div className="bg-zinc-950/30 border border-zinc-900 rounded-2xl p-3 space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Umbrales de activación</p>
                  <div className="flex items-center gap-2 text-[9px] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-zinc-400">VERDE: menos del <span className="text-emerald-400 font-black">30%</span> de alertas</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-zinc-400">AMARILLO: entre <span className="text-amber-400 font-black">30% y 49%</span> de alertas</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-zinc-400">ROJO: <span className="text-rose-400 font-black">50% o más</span> de alertas</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
