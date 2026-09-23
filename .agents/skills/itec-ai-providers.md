---
name: itec-ai-providers
description: "Proveedores y presupuesto de latencia de la IA"
---

# AI Providers

Endpoint `/api/asistente`:
- Deadline: 48s.
- Orden de providers: OpenCode (GLM-5) -> Groq (Llama) -> OpenRouter (Nemotron) -> Gemini.
- Regla: Solo modelos FREE para el asistente.
- Errores transitorios hacen retry; errores 400/401/403/404/413 deshabilitan al provider.
- El system prompt debe ensamblarse sin sobrepasar los límites de contexto, truncando solo el maestro.
