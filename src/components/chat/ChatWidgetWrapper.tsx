'use client'

import { usePathname } from 'next/navigation'
import ChatWidget from '@/components/chat/ChatWidget'

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
