---
name: itec-verify-events-realtime
description: "Checklist de verificación de eventos presenciales y aula virtual en ITEC"
---

# Verificación de Eventos Presenciales y Aula Virtual

## Tablas de Eventos Presenciales
- [ ] `eventos`: `herramientas_activas`(JSONB), `modo_pantalla_gigante`, `semaforo_last_reset_at`, `nube_concepto`, `modalidad`, `meet_url`
- [ ] `eventos_asistentes`: Acreditados (unique evento+email tolerante, upsert en registro)
- [ ] `eventos_encuestas` / `eventos_encuestas_opciones` / `eventos_encuestas_votos`: Encuestas en vivo
- [ ] `eventos_preguntas` / `evento_preguntas_likes`: Preguntas con likes
- [ ] `evento_preguntas_colaborador`: Colaboración en preguntas
- [ ] `evento_nubes` / `evento_nube_palabras` / `eventos_nube_palabras`: Nubes múltiples por evento
- [ ] `evento_semaforo_votos`: Solo `id`, `evento_id`, `dispositivo_id`, `created_at`. Append-only.

## Tablas de Aula Virtual
- [ ] `clases_virtuales`: `modalidad`, `meet_url`, estado `en_vivo`
- [ ] `clase_modometro_votos`: voy_bien/me_perdi/muy_rapido
- [ ] `clase_mano_alzada`: Cola de turno de palabra (atender/bajar)
- [ ] `clase_preguntas` + `clase_pregunta_votos`: Q&A votable con `votos_count`, `resuelta`
- [ ] `clase_encuestas` + `clase_encuesta_respuestas`: Encuestas de clase (opciones JSONB)
- [ ] `clase_semaforo_votos`: Semáforo verde/amarillo/rojo
- [ ] `clase_interacciones`: Interacciones genéricas (chat, mano alzada legacy)

## Encuestas Globales
- [ ] `polls` → `poll_questions` → `poll_options` → `poll_votes`
- [ ] Campo `chart_type` (mig. 018)
- [ ] `trainings` puede tener polls propios (LivePoll de capacitaciones)

## Realtime
- [ ] Todas las tablas de clase están en publicación `supabase_realtime`
- [ ] RPCs: `reiniciar_semaforo_clase(uuid)`, `toggle_pregunta_voto(uuid, uuid, text)`

## Semáforo v3
- [ ] Cálculo centralizado `calcularEstadoSemaforo(votosNegativos, totalAcreditados)`
- [ ] Reset: actualiza `semaforo_last_reset_at=now()` pero NO borra votos
- [ ] Dedup server-side por `dispositivo_id` + índice `(evento_id, dispositivo_id, created_at)`
- [ ] Cooldown adicional de 5s solo client-side

## Anti-duplicación
- [ ] Identificación anónima por UUID en `localStorage` (`dispositivo_id`)
- [ ] Encuestas usan cookie-based dedup (`livepoll_voted_{pollId}`, httpOnly, 24h)
- [ ] Nube de palabras: límite de caracteres (20 móvil, 25 genérico) + anti-duplicado por dispositivo

## Quirks
- [ ] Conviven nombres `eventos_*` y `evento_*` (ej. `eventos_preguntas` vs `evento_preguntas`)
- [ ] RLS abierta intencionalmente en tablas de realtime