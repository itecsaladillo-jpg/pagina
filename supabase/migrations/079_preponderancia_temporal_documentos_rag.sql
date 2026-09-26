-- ============================================================
-- Migración 079: Preponderancia y prioridad temporal en el Prompt Maestro del Asistente ITEC
-- Regla: Del total de la información obtenida en todos los documentos almacenados
-- en el RAG, se le debe dar mayor preponderancia a la información cuya data sea más actual.
-- En los documentos figura la fecha de publicación; la más cercana a la fecha actual
-- tendrá la mayor importancia para los razonamientos de la IA ITEC.
-- ============================================================

DO $$
DECLARE
  prompt_actual TEXT;
  nuevo_prompt TEXT;
  bloque_preponderancia TEXT := E'\n\n## PREPONDERANCIA Y ACTUALIDAD TEMPORAL DE DOCUMENTOS (RAG)\n' ||
    '- Del total de la información obtenida en todos los documentos almacenados en el RAG, debés darle SIEMPRE mayor preponderancia, jerarquía e importancia a la información cuya data sea más actual.\n' ||
    '- En los documentos figura la fecha o año de publicación (o período de relevamiento): siempre la información de documentos cuya publicación sea la más cercana a la fecha actual será la que mayor importancia tendrá para utilizarla en los razonamientos, análisis, cálculos y respuestas de la IA ITEC.\n' ||
    '- Ante divergencias o evoluciones históricas entre documentos de diferentes años, la información del documento de publicación más reciente prevalece de manera absoluta.\n';
BEGIN
  -- Obtener el prompt actual
  SELECT system_prompt INTO prompt_actual
  FROM public.ai_prompt_settings
  WHERE clave_prompt = 'asistente_global';

  IF prompt_actual IS NULL THEN
    RAISE EXCEPTION 'No se encontró el prompt asistente_global';
  END IF;

  -- Si ya contiene la sección, no duplicarla
  IF POSITION('PREPONDERANCIA Y ACTUALIDAD TEMPORAL DE DOCUMENTOS' IN prompt_actual) > 0 THEN
    RAISE NOTICE 'La regla de preponderancia temporal ya está presente en asistente_global';
    RETURN;
  END IF;

  -- Insertar antes de las reglas estrictas o antes de "## Tu misión"
  IF POSITION(E'## REGLAS ESTRICTAS' IN prompt_actual) > 0 THEN
    nuevo_prompt := REPLACE(
      prompt_actual,
      E'## REGLAS ESTRICTAS',
      bloque_preponderancia || E'\n## REGLAS ESTRICTAS'
    );
  ELSIF POSITION(E'## Tu misión' IN prompt_actual) > 0 THEN
    nuevo_prompt := REPLACE(
      prompt_actual,
      E'## Tu misión',
      bloque_preponderancia || E'\n## Tu misión'
    );
  ELSE
    nuevo_prompt := prompt_actual || bloque_preponderancia;
  END IF;

  -- Actualizar en la base de datos
  UPDATE public.ai_prompt_settings
  SET system_prompt = nuevo_prompt,
      updated_at = now()
  WHERE clave_prompt = 'asistente_global';

  RAISE NOTICE 'Prompt del asistente actualizado exitosamente con la regla de preponderancia temporal RAG.';
END $$;
