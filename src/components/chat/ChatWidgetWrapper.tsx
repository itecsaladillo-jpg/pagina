'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false })

const EVENT_ROUTES = [
  '/eventos',
  '/dashboard/eventos-presenciales',
  '/dashboard/eventos',
  '/clases',
]

export default function ChatWidgetWrapper() {
  const pathname = usePathname()

  const isEventTool = EVENT_ROUTES.some(route => pathname?.startsWith(route))

  if (isEventTool) return null

  return <ChatWidget />
}
