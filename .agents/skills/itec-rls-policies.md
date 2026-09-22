---
name: itec-rls-policies
description: "Reglas de seguridad RLS del proyecto ITEC"
---

# Row-Level Security (RLS)

1. Nunca confiar en validación solo en app.
2. Tablas realtime (`clase_modometro_votos`, `evento_semaforo_votos`) tienen RLS abierta intencionalmente (interacciones anónimas).
3. Tablas críticas (`certificados_digitales`) fueron parcheadas en la migración 056 (escritura solo admin/coordinador).
4. `saladillo_for_export` (migración 071): SELECT solo aprobados; INSERT público. Storage bucket `saladillo-export-photos` (público).
