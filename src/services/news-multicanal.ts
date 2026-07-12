import type { NewsFlash } from '@/services/news'

export interface NewsComment {
  id: string
  created_at: string
  member_name: string
  member_email: string
  content: string
  is_deleted: boolean
}

export interface NewsFlashMulticanal extends NewsFlash {
  comments?: NewsComment[]
}
