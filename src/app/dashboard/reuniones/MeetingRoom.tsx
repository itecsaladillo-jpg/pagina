/**
 * MeetingRoom (legacy shim)
 * ──────────────────────────────────────────
 * Re-exporta MeetingCard para mantener
 * compatibilidad con el import en page.tsx.
 * El componente real vive en:
 * src/components/reuniones/MeetingCard.tsx
 */
export { MeetingCard as MeetingRoom } from '@/components/reuniones/MeetingCard'
