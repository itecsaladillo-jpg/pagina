---
name: itec-event-states
description: "Manejo de estados centralizados del Semáforo y Aula Virtual"
---

# Event States

- Semáforo v3: Cálculo centralizado `calcularEstadoSemaforo(votosNegativos, totalAcreditados)`.
- Reset del semáforo: Actualiza `semaforo_last_reset_at=now()` pero NO borra votos.
- La pantalla gigante alterna entre: Bienvenida -> Encuestas -> Preguntas -> Nube.
