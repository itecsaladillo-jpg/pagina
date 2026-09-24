export type {
  WhatsAppContact,
  WhatsAppGroup,
  WhatsAppGroupContact,
  WhatsAppTemplate,
  WhatsAppLog,
  WhatsAppCategory,
  WhatsAppContactSource,
} from '@/types/database'

import type { WhatsAppGroup } from '@/types/database'

/** Grupo con contador de contactos (campo computado, no existe en la tabla) */
export type WhatsAppGroupWithCount = WhatsAppGroup & { contact_count?: number }
