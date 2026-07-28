import { NextRequest, NextResponse } from "next/server";
import { submitSemaphoreVoteAction } from "@/app/dashboard/encuestas/actions";

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

    const result = await submitSemaphoreVoteAction(eventId, visitorId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al registrar" },
        { status: 400 }
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