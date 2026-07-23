import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { historial, tipo } = body;

    if (!historial || !Array.isArray(historial) || historial.length < 2) {
      return NextResponse.json({ error: 'Historial inválido o muy corto' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('chat_conocimiento')
      .insert({ historial, tipo: tipo || 'autogestion' });

    if (error) {
      console.error('[guardar] Error al insertar:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[guardar] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
