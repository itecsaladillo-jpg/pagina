---
name: itec-news-flow
description: "Flujo de generación de noticias multicanal"
---

# News Multicanal Flow

El editor multicanal genera 4 textos a partir de 1 noticia base.
- Escribe dinámicamente en 4 tablas: `notas_publico`, `notas_miembros`, `notas_sponsors`, `notas_medios` y guarda el registro maestro en `news_flashes`.
- Dependencias: API endpoints para consumir desde medios (`/api/press-news`) y para sponsors (`/api/sponsors-news`).
- Los correos de prensa (Resend) consumen `notas_medios`.
