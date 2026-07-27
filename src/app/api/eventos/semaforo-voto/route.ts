import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventoId, visitorId, voto } = body;

    if (!eventoId || !visitorId || !voto) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: eventoId, visitorId, voto" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("evento_semaforo_votos")
      .upsert({
        evento_id: eventoId,
        visitor_id: visitorId,
        voto: voto
      }, { onConflict: "evento_id,visitor_id", ignoreDuplicates: false });

    if (error) {
      console.error("[SEMÁFORO API] Error al insertar voto:", error);
      return NextResponse.json(
        { error: "Error al registrar el voto" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SEMÁFORO API] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error inesperado al procesar el voto" },
      { status: 500 }
    );
  }
}