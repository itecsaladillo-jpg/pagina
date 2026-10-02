'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useStreaming } from '@/contexts/StreamingContext'

const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false })

const EVENT_ROUTES = [
  '/eventos',
  '/dashboard/eventos-presenciales',
  '/dashboard/eventos',
  '/clases',
]

export default function ChatWidgetWrapper() {
  const pathname = usePathname()
  const { isStreamingShowing } = useStreaming()

  const isEventTool = EVENT_ROUTES.some(route => pathname?.startsWith(route))
  const isHomePage = pathname === '/'

  // No mostrar el Asistente ITEC en herramientas de eventos ni cuando la página principal esté mostrando el reproductor de streaming
  if (isEventTool || (isHomePage && isStreamingShowing)) {
    return null
  }

  return <ChatWidget />
}
