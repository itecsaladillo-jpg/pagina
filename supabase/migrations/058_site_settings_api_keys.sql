-- Migración: Agregar campo api_keys JSONB a site_settings
-- Almacena API keys y credenciales de servicios externos de forma centralizada.
-- Las keys se almacenan como pares clave-valor dentro del JSONB.
-- Ejemplo: { "OPENROUTER_API_KEY": "sk-or-v1-xxx", "GEMINI_API_KEY": "AIza..." }

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS api_keys jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.site_settings.api_keys IS 'API keys y credenciales de servicios externos (JSONB key-value). Las claves son los nombres de las variables de entorno.';

-- Asegurar que la política RLS existente cubra el nuevo campo
-- (La política "Solo admins editan settings" ya cubre UPDATE en la tabla completa)
