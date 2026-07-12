import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const news_flash_id = url.searchParams.get('news_flash_id')

  if (!news_flash_id) {
    return Response.json({ error: 'news_flash_id requerido' }, { status: 400 })
  }

  const { data: comments, error } = await supabase
    .from('news_comments')
    .select('id, created_at, member_name, member_email, content')
    .eq('news_flash_id', news_flash_id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ comments: comments || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { news_flash_id, content } = await request.json()

  if (!news_flash_id || !content?.trim()) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const { data: member } = await supabase
    .from('members')
    .select('id, name, email')
    .eq('id', user.id)
    .single()

  if (!member) {
    return Response.json({ error: 'Miembro no encontrado' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('news_comments')
    .insert({
      news_flash_id,
      member_id: member.id,
      member_name: member.name,
      member_email: member.email,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ comment: data })
}
