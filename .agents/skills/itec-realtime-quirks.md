---
name: itec-realtime-quirks
description: "Quirks de realtime, nombres de eventos y anti-duplicación"
---

# Realtime Quirks

- Naming inconsistente: Existen familias `eventos_*` y `evento_*` en la BD (ej. `eventos_preguntas` vs `evento_preguntas`). No intentes refactorizar sin coordinación.
- Anti-duplicación: Basada en localStorage (`dispositivo_id`) para eventos anónimos, y deduplicación server-side.
- RLS abierta: Es intencional en las tablas de realtime.
