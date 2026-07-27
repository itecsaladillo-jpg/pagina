import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROCESSING = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId requerido" }, { status: 400 });
    }

    if (PROCESSING.has(eventId)) {
      return NextResponse.json({ success: true });
    }
    PROCESSING.add(eventId);

    const supabase = await createClient();
    const { error } = await supabase
      .from("evento_semaforo_votos")
      .insert({
        evento_id: eventId,
        visitor_id: `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        voto: "negativo"
      });

    if (error) {
      console.error("[SEMÁFORO API] Error:", error);
      return NextResponse.json(
        { error: error.message || "Error al registrar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[SEMÁFORO API] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error inesperado" },
      { status: 500 }
    );
  } finally {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId") || "all";
    PROCESSING.delete(eventId);
  }
}

export { PROCESSING };