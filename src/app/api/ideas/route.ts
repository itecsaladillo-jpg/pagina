import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const fd = await req.formData()

  const idea_text = fd.get('idea_text')?.toString().trim()
  if (!idea_text || idea_text.length < 10) {
    return NextResponse.json({ success: false, error: 'La idea debe tener al menos 10 caracteres.' })
  }

  const is_anonymous = fd.get('is_anonymous') === 'true'
  const author_name = fd.get('author_name')?.toString().trim() || null
  const author_email = fd.get('author_email')?.toString().trim() || null
  const author_phone = fd.get('author_phone')?.toString().trim() || null

  const { error } = await supabase.from('ideas').insert({
    idea_text,
    is_anonymous,
    author_name: is_anonymous ? null : author_name,
    author_email: is_anonymous ? null : author_email,
    author_phone: is_anonymous ? null : author_phone,
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }

  return NextResponse.json({ success: true })
}
