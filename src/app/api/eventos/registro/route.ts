import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEventWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      eventoId, 
      nombreCompleto, 
      email, 
      telefono, 
      organizacionOEscuela, 
      eventSlug,
      eventName 
    } = body;

    if (!eventoId || !nombreCompleto || !email || !eventSlug || !eventName) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: eventoId, nombreCompleto, email, eventSlug, eventName" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Intentar insertar el asistente. Si ya existe (unique constraint por evento + email),
    // el conflicto de clave única se puede manejar de forma tolerante devolviendo el registro existente.
    const { data: existingAsistente, error: selectError } = await supabase
      .from("eventos_asistentes")
      .select("id, nombre_completo, email, telefono, organizacion_o_escuela")
      .eq("evento_id", eventoId)
      .eq("email", email.trim().toLowerCase())
      .single();

    if (existingAsistente) {
      // Ya estaba pre-acreditado/registrado. Retornamos éxito directo.
      // Disparamos la simulación o envío de email igual, para asegurar que le llegue si lo perdió.
      sendEventWelcomeEmail(
        email.trim().toLowerCase(),
        nombreCompleto.trim(),
        eventName,
        eventSlug
      ).catch(err => console.error("Error al enviar email en re-registro:", err));

      return NextResponse.json({
        success: true,
        message: "Asistente ya registrado anteriormente. Acceso concedido.",
        asistente: existingAsistente
      });
    }

    // Si no existe, procedemos con la inserción
    const { data: newAsistente, error: insertError } = await supabase
      .from("eventos_asistentes")
      .insert({
        evento_id: eventoId,
        nombre_completo: nombreCompleto.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono ? telefono.trim() : null,
        organizacion_o_escuela: organizacionOEscuela ? organizacionOEscuela.trim() : null
      })
      .select("id, nombre_completo, email, telefono, organizacion_o_escuela")
      .single();

    if (insertError) {
      console.error("Error al insertar asistente en Supabase:", insertError);
      return NextResponse.json(
        { error: "Error al procesar el registro en la base de datos." },
        { status: 500 }
      );
    }

    // Disparar envío de correo asíncronamente
    sendEventWelcomeEmail(
      email.trim().toLowerCase(),
      nombreCompleto.trim(),
      eventName,
      eventSlug
    ).catch(err => console.error("Error al enviar email en nuevo registro:", err));

    return NextResponse.json({
      success: true,
      message: "Registro exitoso.",
      asistente: newAsistente
    });

  } catch (err: any) {
    console.error("Error inesperado en endpoint de registro:", err);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al procesar la solicitud." },
      { status: 500 }
    );
  }
}
