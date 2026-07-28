import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, visitorId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId requerido" }, { status: 400 });
    }

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ error: "visitorId requerido" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("evento_semaforo_votos")
      .insert({
        evento_id: eventId,
        visitor_id: visitorId,
        voto: "negativo"
      });

    if (error) {
      console.error("[SEMÁFORO API] Error:", error);
      return NextResponse.json(
        { error: error.message || "Error al registrar" },
        { status: error.code === "PGRST101" ? 403 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[SEMÁFORO API] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error inesperado" },
      { status: 500 }
    );
  }
}