export interface NewsComment {
  id: string
  created_at: string
  member_name: string
  member_email: string
  content: string
  is_deleted: boolean
}

export interface NewsFlashMulticanal {
  id: string
  created_at: string
  updated_at: string
  autor_id: string | null
  titulo: string
  datos_crudos: string
  texto_publico: string
  texto_miembros: string
  texto_sponsors: string
  texto_medios: string
  is_published: boolean
  para_publico: boolean
  para_miembros: boolean
  para_sponsors: boolean
  para_medios: boolean
  media_urls?: string[]
  comments?: NewsComment[]
}
