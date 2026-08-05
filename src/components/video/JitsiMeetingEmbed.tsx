'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JitsiMeetExternalAPI: any
  }
}

interface JitsiMeetingEmbedProps {
  roomName: string
  displayName: string
  email?: string
  className?: string
}

export function JitsiMeetingEmbed({
  roomName,
  displayName,
  email = '',
  className = '',
}: JitsiMeetingEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<ReturnType<Window['JitsiMeetExternalAPI']> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.async = true
      script.onload = () => initJitsi()
      document.head.appendChild(script)
    }

    const initJitsi = () => {
      if (!containerRef.current || apiRef.current) return

      const options = {
        roomName,
        parentNode: containerRef.current,
        userInfo: {
          displayName: displayName || 'Usuario ITEC',
          email,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          toolbarButtons: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'hangup',
            'chat',
            'recording',
            'security',
            'settings',
            'tileview',
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_POWERED_BY: false,
          DEFAULT_BACKGROUND: '#070b13',
          TOOLBAR_ALWAYS_VISIBLE: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          SHOW_CHROME_ICE_BANNER: false,
        },
      }

      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options)

      apiRef.current.addEventListener('readyToClose', () => {})

      // Respaldo: ejecutar displayName después de que Jitsi carga
      setTimeout(() => {
        apiRef.current?.executeCommand('displayName', displayName || 'Usuario ITEC')
      }, 3000)
    }

    loadJitsi()

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [roomName, displayName, email])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[400px] rounded-2xl overflow-hidden ${className}`}
    />
  )
}
