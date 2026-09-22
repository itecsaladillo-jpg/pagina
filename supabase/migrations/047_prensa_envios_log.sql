-- ============================================================
-- ITEC Augusto Cicaré - Migración 047: Auditoría de envíos de
-- gacetillas a medios de prensa
-- ============================================================

-- Tabla para registrar cada envío individual de gacetilla a un medio
CREATE TABLE IF NOT EXISTS public.prensa_envios_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  news_flash_id UUID NOT NULL REFERENCES public.news_flashes(id) ON DELETE CASCADE,
  medio_id UUID NULL REFERENCES public.medios_prensa(id) ON DELETE SET NULL,
  medio_nombre TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('enviado', 'fallido')),
  error_message TEXT NULL,
  sent_by_member_id UUID NOT NULL REFERENCES public.members(id)
);

-- Índices para optimizar consultas de historial
CREATE INDEX IF NOT EXISTS idx_prensa_envios_news_flash ON public.prensa_envios_log(news_flash_id);
CREATE INDEX IF NOT EXISTS idx_prensa_envios_created_at ON public.prensa_envios_log(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.prensa_envios_log ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (solo lectura y creación para usuarios autenticados)
CREATE POLICY "Permitir lectura de logs a miembros" ON public.prensa_envios_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir insercion de logs a miembros" ON public.prensa_envios_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
