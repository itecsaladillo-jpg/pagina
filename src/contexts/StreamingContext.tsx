'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { extractYouTubeId } from '@/lib/youtube'

interface StreamingContextProps {
  isStreamingActive: boolean
  streamingUrl: string | null
  isStreamingShowing: boolean
  setIsStreamingShowing: (showing: boolean) => void
}

const StreamingContext = createContext<StreamingContextProps>({
  isStreamingActive: false,
  streamingUrl: null,
  isStreamingShowing: false,
  setIsStreamingShowing: () => {},
})

export function StreamingProvider({ children }: { children: React.ReactNode }) {
  const [isStreamingActive, setIsStreamingActive] = useState(false)
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null)
  const [isStreamingShowing, setIsStreamingShowing] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/streaming/status?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const active = Boolean(data.streaming_enabled ?? data.isActive)
        const url = data.youtubeUrl || null
        const isValid = Boolean(url && extractYouTubeId(url))
        setIsStreamingActive(active)
        setStreamingUrl(url)
        setIsStreamingShowing(active && isValid)
      } catch {
        // silent fail
      }
    }

    checkStatus()

    const channel = supabase
      .channel('streaming_context_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'streaming_config' },
        (payload: { new?: { streaming_enabled?: boolean; youtube_url?: string } }) => {
          if (payload.new) {
            const active = Boolean(payload.new.streaming_enabled)
            const url = payload.new.youtube_url || null
            const isValid = Boolean(url && extractYouTubeId(url))
            setIsStreamingActive(active)
            setStreamingUrl(url)
            setIsStreamingShowing(active && isValid)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'api_settings' },
        () => {
          checkStatus()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <StreamingContext.Provider
      value={{
        isStreamingActive,
        streamingUrl,
        isStreamingShowing,
        setIsStreamingShowing,
      }}
    >
      {children}
    </StreamingContext.Provider>
  )
}

export function useStreaming() {
  return useContext(StreamingContext)
}
