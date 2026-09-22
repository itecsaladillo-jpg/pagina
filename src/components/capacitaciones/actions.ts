'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function voteLivePollAction(pollId: string, optionId: string) {
  try {
    const cookieStore = await cookies()

    const hasVoted = cookieStore.get(`livepoll_voted_${pollId}`)
    if (hasVoted) {
      return { success: false, error: 'Ya votaste en esta encuesta.' }
    }

    const supabase = await createClient()

    const { data: option, error: fetchError } = await supabase
      .from('poll_options')
      .select('votes_count')
      .eq('id', optionId)
      .single()

    if (fetchError || !option) {
      return { success: false, error: 'Opción no encontrada.' }
    }

    const { error } = await supabase
      .from('poll_options')
      .update({ votes_count: (option.votes_count || 0) + 1 })
      .eq('id', optionId)

    if (error) throw error

    cookieStore.set(`livepoll_voted_${pollId}`, 'true', {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    return { success: true }
  } catch (err: any) {
    console.error('[voteLivePollAction]', err)
    return { success: false, error: 'Error al registrar el voto.' }
  }
}
