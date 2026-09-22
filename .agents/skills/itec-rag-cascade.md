---
name: itec-rag-cascade
description: "Arquitectura de RAG de 5 niveles del asistente ITEC"
---

# RAG Cascade (5 Niveles)

Orden estricto de resolución:
P1 -> P2 -> P3 -> P4 -> Soft Fallback -> P5 (Web).

El "Soft Fallback" significa que un resultado propio institucional bajo threshold tiene prioridad sobre buscar en internet.
Los umbrales (thresholds) fueron recalibrados en agosto 2026 para evitar negativas falsas. No modificarlos sin autorización.
