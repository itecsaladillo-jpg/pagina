import { Metadata } from "next";
import { getCurrentMember, isAdmin } from "@/services/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import EventosPresencialesClient from "./EventosPresencialesClient";

export const metadata: Metadata = {
  title: "Eventos Presenciales QR — ITEC",
};

export default async function EventosPresencialesDashboard() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const supabase = await createClient();

  // Obtener todos los eventos presenciales del nuevo sistema
  const { data: eventos, error } = await supabase
    .from("eventos")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error("Error al obtener eventos presenciales:", error);
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Calendar className="text-indigo-400" size={32} />
            Eventos Presenciales QR
          </h1>
          <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
            Unificá la interactividad en tu auditorio con un único código QR por conferencia. Crea tus eventos presenciales, activa encuestas en tiempo real, modera preguntas en vivo y visualiza palabras de la nube.
          </p>
        </div>
      </div>

      <EventosPresencialesClient initialEventos={eventos || []} />
    </div>
  );
}
