import { Metadata } from "next";
import { getCurrentMember } from "@/services/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PanelOradorClient from "./PanelOradorClient";

export const metadata: Metadata = {
  title: "Panel en Vivo del Disertante — ITEC",
};

export default async function PanelOradorPage({ params }: { params: any }) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  // Resolver el ID de los parámetros dinámicos
  const resolvedParams = params && typeof params.then === "function"
    ? await params
    : params;
  
  const eventoId = resolvedParams?.id || "";
  if (!eventoId) redirect("/dashboard/eventos-presenciales");

  const supabase = await createClient();

  // Obtener la información del evento presencial
  const { data: evento, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .single();

  if (error || !evento) {
    console.error("Error al obtener el evento:", error);
    redirect("/dashboard/eventos-presenciales");
  }

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in">
      <PanelOradorClient initialEvento={evento} />
    </div>
  );
}
