-- Agregar datos estadísticos de Saladillo al prompt maestro del asistente
-- Problema: el prompt en BD no incluía datos numéricos, causando que el asistente
-- se niegue a dar cifras y redirija a fuentes externas innecesariamente.
-- Solución: reemplazar el system_prompt con una versión que tenga los datos
-- demográficos al INICIO (después de la personalidad, antes de las reglas)
-- para que nunca se truncen y el LLM los tenga SIEMPRE disponibles.

DO $$
DECLARE
  prompt_actual TEXT;
  nuevo_prompt TEXT;
  marcador_personalidad TEXT := '## REGLAS ESTRICTAS Y TEMAS EXCLUIDOS — OBLIGATORIAS';
  bloque_datos TEXT := E'\n\n## DATOS ESTADÍSTICOS DE SALADILLO (Censo INDEC 2022)\n' ||
    'Cuando el contexto incluya datos numéricos sobre Saladillo, UTILIZALOS DIRECTAMENTE en tus respuestas. ' ||
    'NO redirijas al usuario a consultar fuentes externas si ya tenés el dato disponible.\n\n' ||
    '- Población total del Partido: 35.656 habitantes (Censo 2022)\n' ||
    '- Población cabecera urbana (Saladillo): 34.247 habitantes (Censo 2022)\n' ||
    '- Variación intercensal (2010-2022): +11,1% (3.553 habitantes más)\n' ||
    '- Densidad poblacional: 13,2 hab/km²\n' ||
    '- Superficie total: 2.706 km² (273.600 hectáreas)\n' ||
    '- Localidades del Partido con sus habitantes:\n' ||
    '  • Saladillo (cabecera): 34.247 hab.\n' ||
    '  • Del Carril: 1.225 hab.\n' ||
    '  • Polvaredas: 405 hab.\n' ||
    '  • Álvarez de Toledo: 287 hab.\n' ||
    '  • Cazón: 251 hab.\n' ||
    '  • Juan José Blaquier: 12 hab.\n' ||
    '- Estructura por sexo: Mujeres 18.310 (51,35%), Varones 17.346 (48,65%)\n' ||
    '- Estructura por edad: 0-14 años (21,31%), 15-24 (13,96%), 25-54 (38,53%), 55-64 (9,87%), 65+ (16,31%)\n' ||
    '- Viviendas totales: 16.329 (16.309 particulares, 20 colectivas)\n' ||
    '- Precipitaciones acumuladas 2025: 1.645,70 mm\n' ||
    '- Conectividad vial: RN 205, RP 51, RP 91, RP 215\n' ||
    '- Código Postal: 7260 | Prefijo telefónico: 02344/02345\n\n' ||
    'INSTRUCCIONES PARA DATOS NUMÉRICOS:\n' ||
    '• Si el usuario pregunta "¿cuántos habitantes tiene Saladillo?", respondé DIRECTAMENTE con la cifra.\n' ||
    '• Podés realizar cálculos simples: porcentajes, comparaciones entre localidades, tasas de crecimiento.\n' ||
    '• Sacá conclusiones basadas en los datos: qué implica un dato en contexto.\n' ||
    '• Presentá datos múltiples en formato de lista o tabla cuando sea útil.\n' ||
    '• Siempre mencioná la fuente: "según el Censo 2022 del INDEC".\n';
BEGIN
  -- Obtener el prompt actual
  SELECT system_prompt INTO prompt_actual
  FROM public.ai_prompt_settings
  WHERE clave_prompt = 'asistente_global';

  IF prompt_actual IS NULL THEN
    RAISE EXCEPTION 'No se encontró el prompt asistente_global';
  END IF;

  -- Insertar los datos numéricos después de la personalidad pero antes de las reglas estrictas
  -- Esto garantiza que los datos estén al inicio y no se truncen
  nuevo_prompt := REPLACE(
    prompt_actual,
    marcador_personalidad,
    bloque_datos || marcador_personalidad
  );

  -- Si no se encontró el marcador (prompt modificado manualmente), agregar antes de "## Tu misión"
  IF nuevo_prompt = prompt_actual THEN
    IF POSITION(E'\n## Tu misión' IN prompt_actual) > 0 THEN
      nuevo_prompt := LEFT(prompt_actual, POSITION(E'\n## Tu misión' IN prompt_actual) - 1) ||
        bloque_datos ||
        SUBSTRING(prompt_actual FROM POSITION(E'\n## Tu misión' IN prompt_actual));
    ELSE
      -- Si tampoco hay "## Tu misión", agregar después de la personalidad
      nuevo_prompt := LEFT(prompt_actual, POSITION(E'\n## REGLAS' IN prompt_actual) - 1) ||
        bloque_datos ||
        SUBSTRING(prompt_actual FROM POSITION(E'\n## REGLAS' IN prompt_actual));
    END IF;
  END IF;

  -- Actualizar el prompt
  UPDATE public.ai_prompt_settings
  SET system_prompt = nuevo_prompt,
      updated_at = now()
  WHERE clave_prompt = 'asistente_global';

  -- Verificar que se actualizó correctamente
  IF NOT EXISTS (
    SELECT 1 FROM public.ai_prompt_settings
    WHERE clave_prompt = 'asistente_global'
    AND system_prompt LIKE '%DATOS ESTADÍSTICOS DE SALADILLO%'
  ) THEN
    RAISE EXCEPTION 'Error: el prompt no se actualizó correctamente';
  END IF;

  RAISE NOTICE 'Prompt del asistente actualizado exitosamente con datos estadísticos de Saladillo';
END $$;
