# IA ITEC — Especificación Técnica Integral y Arquitectura del Sistema
*(Anteriormente denominado "Asistente ITEC" / "Asistente Virtual")*

> **Propósito del Documento:**  
> Este documento constituye la fuente de verdad técnica absoluta y exclusiva de la **IA ITEC**. Está diseñado para servir como contexto de referencia para que cualquier agente de IA o equipo de desarrollo pueda **comprender exhaustivamente su funcionamiento actual y planificar futuras ampliaciones** sin comprometer la estabilidad, el costo $0 de inferencia, las restricciones del Edge Runtime ni la jerarquía de recuperación de información.

---

## 1. Identidad, Misión y Filosofía de Diseño

### 1.1 Identidad y Tono
- **Nombre oficial**: IA ITEC (o Asistente ITEC).
- **Entidad**: Instituto Tecnológico de Saladillo (ITEC) — Asociación Civil de Ciencia y Tecnología "Augusto Cicaré".
- **Localización**: Saladillo, Provincia de Buenos Aires, República Argentina.
- **Tono comunicacional**: Español rioplatense formal y cercano (uso natural del voseo: *"Hola, ¿en qué te puedo ayudar?"*), empático, riguroso y técnicamente preciso.
- **Especialización medular**:
  - Vida, obra e inventos de **Augusto Ulderico Cicaré ("Pirincho")** y la industria de helicópteros de Saladillo.
  - Evento anual **Expo ITEC**, historia institucional, comisiones y actividades.
  - Realidad socioproductiva, demográfica, geográfica, cartográfica y estadística del Partido de Saladillo.

### 1.2 Principio Arquitectónico Rector: 100% Modelos Gratuitos (Costo $0)
Todos los servicios de inferencia conversacional de la IA ITEC están diseñados bajo la premisa de **costo operativo cero**. No se utilizan suscripciones de pago por token para la atención general del chatbot. Para garantizar alta disponibilidad frente a las cuotas de tiers gratuitos, el sistema implementa una **cadena de resiliencia con reintentos multi-pasada** y failover automático entre múltiples proveedores globales.

---

## 2. Arquitectura de Alto Nivel y Flujo de Procesamiento

El flujo de procesamiento desde la interacción del usuario hasta la entrega de la respuesta sigue un pipeline determinístico:

```
[Usuario en Frontend (ChatWidget)]
               │
               ▼
[POST /api/asistente (Next.js App Router)]
   ├─ 1. Validación de payload y generación/recuperación de sessionId
   ├─ 2. Recuperación RAG en Cascada (5 Niveles) ──────────────────────────┐
   ├─ 3. Inyección de Contexto Dinámico desde Supabase (DB viva)          │
   ├─ 4. Ensamblado y Presupuesto del Prompt (< 18.000 chars)             ▼
   │     (Prompt Maestro + RAG prioritario + Tablas DB + Política Final)
   ├─ 5. Cadena de Inferencia Multi-Proveedor (Deadline: 48s)
   │     [OpenCode mimo-v2.5] ──► [Groq gpt-oss-20b] ──► [OpenRouter] ──► [Google Gemini Flash]
   │           ▲                                                                 │
   │           └─────────── Reintento en Pasada 2, 3 (si hay budget) ───────────┘
   ├─ 6. Auditoría Post-Respuesta (auditarRespuestaIA)
   ├─ 7. Persistencia Asíncrona de Conversación (P4)
   └─ 8. Retorno JSON al cliente con payload limpio
```

---

## 3. Endpoints y Puntos de Entrada API

### 3.1 `POST /api/asistente` (Endpoint Principal)
- **Archivo**: [src/app/api/asistente/route.ts](file:///e:/ITEC/src/app/api/asistente/route.ts)
- **Configuración de Runtime**: `export const maxDuration = 60` (optimizado para Vercel Serverless / Edge compat).
- **Payload de entrada**:
  ```json
  {
    "mensaje": "string (obligatorio)",
    "historial": [
      { "role": "user" | "model" | "assistant", "content": "string" }
    ],
    "sessionId": "string (UUID v4 o fallback)"
  }
  ```
- **Presupuesto temporal (`DEADLINE_MS`)**: **48.000 ms**.
  - Permite realizar múltiples pasadas entre proveedores si alguno arroja error 429 (rate limit) o timeout, reservando los últimos 12 segundos para la finalización del request y auditoría.
- **Respuesta JSON**:
  ```json
  {
    "respuesta": "Texto final de la IA auditado y saneado",
    "modelo": "Nombre del modelo que resolvió la consulta (ej. mimo-v2.5-free)",
    "fallback": true, // Opcional, solo si resolvió un provider de respaldo o pasada > 1
    "guardado": true  // Opcional, si la conversación fue persistida en BD
  }
  ```

### 3.2 `POST /api/chat` (Endpoint Alternativo / Interno)
- **Archivo**: [src/app/api/chat/route.ts](file:///e:/ITEC/src/app/api/chat/route.ts)
- Orientado a interacciones directas con Groq SDK, streaming de texto o pruebas simplificadas.

### 3.3 `POST /api/asistente/feedback`
- **Archivo**: [src/app/api/asistente/feedback/route.ts](file:///e:/ITEC/src/app/api/asistente/feedback/route.ts)
- Registra la satisfacción del usuario (`muy_util`, `util`, `no_util`, `error`), genera un resumen semántico de la interacción utilizando Ollama self-hosted (`llama3.2:latest`) o Gemini, y guarda el vector embedding en `asistente_feedback` para mejora continua.

### 3.4 Puertas de Diagnóstico Seguro (`diag-gate`)
- **Archivos**:
  - [src/app/api/asistente/diag-gate.ts](file:///e:/ITEC/src/app/api/asistente/diag-gate.ts)
  - [src/app/api/asistente/debug/route.ts](file:///e:/ITEC/src/app/api/asistente/debug/route.ts)
  - [src/app/api/asistente/test/route.ts](file:///e:/ITEC/src/app/api/asistente/test/route.ts)
- **Seguridad**: En producción, estos endpoints exigen el header `x-diag-key` coincidente con la variable `DIAG_SECRETO`. Si no coincide, retorna `404 Not Found` (ofuscación total). Ejecuta un ping real a cada provider configurado para diagnosticar disponibilidad inmediata.

---

## 4. Cadena de Proveedores y Modelos de Inferencia

### 4.1 Prioridad de Invocación y Parámetros

| Orden | Proveedor | Modelo | Timeout | Endpoint / Autenticación | Particularidades |
|---|---|---|---|---|---|
| **1** | **OpenCode** | `mimo-v2.5-free` (o `opencode/glm-5-free`) | 13.000 ms | `https://api.opencode.ai/v1/chat/completions`<br>`Authorization: Bearer OPENCODE_API_KEY` | Requiere header obligatorio `x-session-id`. Devuelve a veces encabezados como *"User Safety: safe"* que son desinfectados automáticamente. |
| **2** | **Groq** | `openai/gpt-oss-20b` | 13.000 ms | `https://api.groq.com/openai/v1/chat/completions`<br>`Authorization: Bearer GROQ_API_KEY` | Alta velocidad de inferencia (< 1.5s). Soporta múltiples keys de fallback. |
| **3** | **OpenRouter** | `nvidia/nemotron-3-super-120b-a12b:free` (o auto-router `:free`) | 13.000 ms | `https://openrouter.ai/api/v1/chat/completions`<br>`Authorization: Bearer OPENROUTER_API_KEY` | Headers obligatorios `HTTP-Referer: https://itecsaladillo.org.ar` y `X-Title: ITEC Asistente`. |
| **4** | **Google Gemini** | `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-flash-latest` | 18.000 ms | REST API v1beta Google AI Studio<br>`?key=GEMINI_API_KEY` | Rota entre múltiples modelos Flash y keys rotativas de `api_settings`. Alta capacidad de ventana y máxima resiliencia. |

### 4.2 Lógica de Resiliencia Multi-Pasada
- **Clasificación de Errores**:
  - **Transitorios** (HTTP 429, 500, 502, 503, 504, Timeout, Fetch Network Failure): El provider falla en la pasada actual pero **se mantiene elegible** para la siguiente pasada tras un `BACKOFF_MS = 1200 ms`.
  - **Permanentes** (HTTP 400, 401, 403, 404, 413): El provider se **deshabilita** por el resto del ciclo de vida del request para no quemar tiempo innecesario.
- **Validación Estricta de Respuesta**: Si el modelo retorna texto vacío, menor a 10 caracteres o un mensaje de error simulado, se lanza excepción y se continúa al siguiente eslabón.

---

## 5. Cascada RAG de 5 Niveles (`src/lib/rag/ragCascade.ts`)

La recuperación de contexto documental opera bajo una estricta jerarquía de prioridades. Un nivel superior satisfactorio anula la necesidad de consultar los niveles inferiores.

```
Query de Usuario
       │
       ▼
[P1: Vector Search (pgvector)] ──(score ≥ 0.15)──► Contexto Recuperado
       │ (< 0.15 o error)
       ▼
[P2: Docs Locales en Memoria] ───(score ≥ 0.22)──► Contexto Recuperado
       │ (< 0.22)
       ▼
[P3: Bucket "training-docs"] ────(score ≥ 0.22)──► Contexto Recuperado
       │ (< 0.22 o vacío)
       ▼
[P4: Chats Previos (Session)] ───(score ≥ 0.35)──► Contexto Recuperado
       │ (sin matches)
       ▼
[Soft Fallback Institucional] ───(score > 0)─────► Contexto Recuperado (Mejor propio)
       │ (score = 0)
       ▼
[P5: DuckDuckGo Search] ─────────────────────────► Contexto Web
```

### 5.1 Nivel P1: Búsqueda Semántica Vectorial (`documents`)
- **Motor**: PostgreSQL + extensión `pgvector` en Supabase.
- **Modelo de Embedding**: Google Gemini `gemini-embedding-001` (o `text-embedding-004`) con `outputDimensionality: 768` forzado para consistencia con el vector store. Fallback: HuggingFace `all-MiniLM-L6-v2` (384 dims rellenadas con ceros a 768).
- **Función RPC**: `match_documents(query_embedding, match_threshold, match_count)`.
- **Threshold**: `0.15` (cosine similarity). Recupera hasta 6 chunks (máx. 3200 caracteres concatenados).

### 5.2 Nivel P2: Base Documental en Memoria Edge (`DOCS_CONTEXT`)
- **Archivos**:
  - `src/lib/docsContext.ts` (exportación de string literal TypeScript).
  - `src/lib/docsContext.json` (mismo contenido en JSON estructurado).
- **Métricas Actuales (Septiembre 2026)**:
  - **2.476.099 caracteres** en memoria RAM.
  - **71 documentos oficiales** consolidados.
- **Algoritmo de Matching en Memoria (Zero I/O)**:
  - Tokenización en español con remoción de acentos/diacríticos y stopwords.
  - Chunking con solapamiento (`CHUNK_SIZE = 900`, `CHUNK_OVERLAP = 120`).
  - Coeficiente de Overlap de Tokens:
    $$\text{Overlap}(Q, C) = \frac{|Tokens(Q) \cap Tokens(C)|}{\min(|Tokens(Q)|, |Tokens(C)|)}$$
  - Umbral de activación: `score >= 0.22`. Extrae los 3 mejores chunks.
- **Script de Sincronización**:
  - Comando: `npm run sync-docs` (`scripts/generateDocsContext.mjs`).
  - Procesa todos los `.pdf`, `.txt` y `.md` de la carpeta `docs/`.
  - Normaliza caracteres de control, une saltos de línea huérfanos y genera el bundle estático.

### 5.3 Nivel P3: Supabase Storage Bucket `training-docs`
- **Ubicación**: Bucket público de Supabase `training-docs`.
- **Filtro de archivos**: Solo descarga `.txt`, `.md` y `.json` (descarta binarios y PDFs pesados).
- **Mecanismo Anti-Stampede y Caché**:
  - Caché en memoria con TTL de 5 minutos (`P3_CACHE_TTL_MS = 300.000 ms`).
  - Deduplicación concurrente: Si dos requests simultáneos solicitan P3, comparten la misma promesa `p3FetchPromise`.

### 5.4 Nivel P4: Conversaciones Guardadas (`saved_conversations`)
- Búsqueda semántica sobre chats previamente guardados vinculados al `sessionId` del cliente.
- Umbral de similitud: `0.35`.

### 5.5 Soft Fallback Institucional
- **Regla Crítica**: Si P1, P2 y P3 tienen resultados pero quedan por debajo de sus thresholds (ej. score 0.18 en P2), el sistema **NO salta directamente a la web**. Toma el mejor resultado propio alcanzado.
- *Fundamento:* Cualquier fragmento de un documento oficial de ITEC o Saladillo es infinitamente más fidedigno y seguro que un resultado genérico de la web abierta.

### 5.6 Nivel P5: Búsqueda Web Fallback (DuckDuckGo Nativo)
- Se activa **únicamente** si todos los niveles propios arrojaron score 0.
- Consulta inicial: DuckDuckGo Instant Answer API enriquecida con `"itec saladillo Cicaré expo itec"`.
- Fallback secundario de P5: Si la Instant Answer no produce al menos 80 caracteres, ejecuta un scraping HTML liviano directo contra `https://lite.duckduckgo.com/lite/` extrayendo los snippets de `<td class="result-snippet">`.
- **PROHIBICIÓN ESTRICTA**: No se permite el uso de Serper API ni servicios pagos de búsqueda web.

---

## 6. Acervo de Conocimiento Incorporado en el RAG

La IA ITEC cuenta con un acervo documental multidimensional en `docs/`:

### 6.1 Cartografía, Planos, Red Vial y Sentidos de Circulación
- [docs/nomenclatura_calles_sentidos_y_localidades_saladillo.md](file:///e:/ITEC/docs/nomenclatura_calles_sentidos_y_localidades_saladillo.md):
  - **Cuatro Avenidas del Cuadrante Histórico**: Rivadavia, San Martín, Belgrano y Moreno.
  - **Avenidas Circunvalares y Conectores**: Pereyra, Cabral, Bozán, Frocham, Acosta, Saavedra, Ledesma, Sanguinetti, Perón, Ulderico Cicaré y Aureliano Roight.
  - **Calles Urbanas y Barrios**: Nómina completa de figuras históricas, pensadores, próceres y barrios residenciales con nombres de flora (Ceibo, Araucaria, Acacias, Nogales, Plátanos, Sauces, Álamos).
  - **Esquema de Sentidos de Circulación 2025**: Mano única alternada en calles paralelas (Noroeste-Sureste y Suroeste-Noreste), dársenas y estacionamiento medido/mano derecha.
- **Planos de Localidades del Partido**:
  - **Cazón**: Nombres de provincias argentinas, Acceso Armendáriz, Estación FFCC, Vivero Municipal Holmberg, Base de Campamento.
  - **Del Carril**: Av. Rivadavia, Acceso Pisani, Estación de Tren, calles históricas y alturas del 600 al 1800.
  - **Saladillo Norte**: Localidad formalizada, radio censal 067070401, Escuela Primaria N° 11 "República de Costa Rica", Jardín N° 908.
  - **Polvaredas y Álvarez de Toledo**: Accesos por RP 215 y RP 51, trazados en torno al predio ferroviario.

### 6.2 Código de Ordenamiento Urbano (COU) y Normativas
- `cou_partido_de_saladillo_planos.pdf` (> 259.000 caracteres): Zonificación completa (R1 residencial baja, R2 media, R3 alta densidad/centro, C comercial, I industrial/logística en márgenes de RN 205 y RP 51), indicadores FOS/FOT, retiros y cesiones para apertura de calles.
- Decretos y ordenanzas de parcelamiento, mensuras y plusvalía urbana (Decreto 791/2024, Ordenanzas 19/19 y 124/2022).

### 6.3 Memorias Anuales, Balances y Ejercicios Económicos
- `Memoria 2022-2023.pdf` (79° Ejercicio): 140.960 caracteres.
- `Memoria 2023-2024.pdf` (80° Ejercicio): 173.472 caracteres.
- `Memoria 2024-2025.pdf` (81° Ejercicio finalizado a junio 2025): 160.474 caracteres. Nómina de autoridades vigentes (Pablo Lara, Daniel Massa, Ignacio Goñi, Francisco Cotignola, Danilo Mengarelli, etc.), balances contables y evolución patrimonial.

### 6.4 Datos Estadísticos Oficiales de Saladillo
- **Anuarios Estadísticos N° 1, 2 y 3 (Año 2025)** del Observatorio de Estadísticas y Banco Municipal de Datos.
- **Censo INDEC 2022**: Población total 35.656 hab. (+11,1% intercensal), 18.310 mujeres, 17.346 varones, 16.329 viviendas, precipitaciones anuales 2025 (1.645,70 mm con pico en febrero de 309,60 mm).
- Producción local, cadenas de valor agropecuarias (Salvatierra JMS), movimiento ganadero, comercio y salud pública.

### 6.5 Base Histórica e Institucional de Augusto Cicaré e ITEC
- Biografía técnica y cronología de inventos de Augusto Ulderico Cicaré.
- Documentos fundacionales y memorias de la Expo ITEC 2023, 2024 y 2025.
- Vinculación con UNLP, UNICEN, CONICET, CIC, INTI, INTA y Cicaré S.A.

---

## 7. Preponderancia Temporal de Datos (Regla de Oro RAG)

En sistemas que compilan documentos que abarcan desde 1863 hasta 2026, pueden surgir divergencias entre datos históricos y cifras actuales. Para resolver esto, la IA ITEC tiene codificada a fuego la siguiente instrucción de **máxima jerarquía**:

> **Regla de Preponderancia Temporal:**  
> *"Del total de la información obtenida en todos los documentos almacenados en el RAG, se le debe dar SIEMPRE mayor preponderancia a la información cuya data sea más actual. En los documentos figura la fecha de publicación: siempre la información del documento cuya publicación sea la más cercana a la fecha actual tendrá mayor importancia para los razonamientos, conclusiones y respuestas de la IA ITEC. Ante datos discrepantes entre documentos de diferentes años, prevalecen categóricamente los del documento más reciente."*

Esta directiva está inyectada en:
1. El Prompt Maestro en base de datos (`ai_prompt_settings`, clave `asistente_global`).
2. La constante `FALLBACK_PROMPT` en [src/lib/ai/constants.ts](file:///e:/ITEC/src/lib/ai/constants.ts).
3. La constante `POLITICA_RESPUESTA_INTEGRAL` que se concatena al final del system prompt en cada ejecución.

---

## 8. Inyección de Contexto en Tiempo Real (Base de Datos Viva)

Además de los documentos estáticos del RAG, en cada petición el endpoint `/api/asistente` consulta concurrentemente vía `Promise.allSettled` a Supabase las siguientes tablas vivas:

| Entidad / Tabla | Propósito de la Inyección |
|---|---|
| `ai_prompt_settings` (`asistente_global`) | Prompt maestro editable por administradores sin necesidad de deploy. |
| `obtener_miembros_publicos` (RPC) | Nómina de coordinadores y staff activo (nombres y roles; omite email/teléfono por protección de privacidad). |
| `notas_publico` | Últimas 10 noticias publicadas en el sitio web institucional. |
| `commissions` | Lista de comisiones de trabajo activas y sus descripciones. |
| `itec_actions` | Próximas actividades, eventos presenciales y proyectos en estado `planificacion` o `en_curso`. |
| `public_articles` | Últimos 15 artículos de divulgación científica y tecnológica redactados por ITEC. |
| `obtener_socios_publicos` (RPC) | Sponsors oficiales clasificados por tier (Platino, Oro, Plata, Bronce), Alianzas Estratégicas y Canales de Difusión. |
| `videos` | Videoteca oficial de YouTube con títulos y resúmenes ejecutivos generados por IA. |
| `mapa_empresas` | Directorio productivo local: empresas registradas con descripción de oferta y demanda tecnológica. |

### 8.1 Presupuesto de Prompt y Protección de Contexto
- **Límite total (`MAX_PROMPT_CHARS`)**: **18.000 caracteres**.
- **Jerarquía de preservación**:
  1. El bloque RAG y el contexto de base de datos viva **NUNCA se truncan**.
  2. La `POLITICA_RESPUESTA_INTEGRAL` va siempre al final íntegra.
  3. Si la suma total excede los 18.000 caracteres, **únicamente se trunca el Prompt Maestro estático** a un mínimo de 3.500 caracteres.
  - *Lección aprendida:* Históricamente, truncar el contexto al final eliminaba la información del RAG y de los artículos, provocando que la IA respondiera que "no tenía información".

---

## 9. Seguridad, Auditoría y Diagnóstico

### 9.1 Auditoría Post-Respuesta (`auditarRespuestaIA`)
Implementada en [src/services/ai.ts](file:///e:/ITEC/src/services/ai.ts), analiza toda respuesta generada antes de entregarla al usuario:
1. **Rutas internas del sistema**: Si el modelo expone URLs o rutas de endpoints (`/api/...`, `/dashboard/...`), son redactadas automáticamente reemplazándolas por `"Sección institucional de ITEC"`.
2. **Peques ITEC**: El programa es de carácter público y difundible. Solo genera log de auditoría sin bloquear la respuesta.
3. **Lenguaje informal / regionalismos inapropiados**: Registro de log para métricas de calidad sin interrupción de servicio.
4. **Violaciones graves**: Se guardan en la tabla `ai_auditoria_violaciones` para análisis de los administradores.

### 9.2 Manejo de Tokens y Privacidad (PII)
- La anon key de Supabase en el frontend solo accede a información pública vía políticas RLS.
- Las API routes del asistente usan un cliente privilegiado con `SUPABASE_SERVICE_ROLE_KEY` en el backend para poder recuperar documentos de `documents` y consultar `ai_prompt_settings`.
- En ningún caso se revelan claves de API, números telefónicos privados ni direcciones de correo en los prompts devueltos.

---

## 10. Frontend y Experiencia de Usuario (`ChatWidget.tsx`)

### 10.1 Componente Flotante Global
- **Archivo**: [src/components/chat/ChatWidget.tsx](file:///e:/ITEC/src/components/chat/ChatWidget.tsx) y `ChatWidget.css`.
- **Características**:
  - Botón flotante inferior con avatar dinámico del asistente (extraído vía RPC `obtener_miembros_publicos` o fallback SVG).
  - Persistencia de mensajes en `localStorage` (`itec_chat_mensajes`, hasta 50 mensajes).
  - **Manejo de Hidratación en Next.js**: La lectura de `localStorage` se realiza estrictamente dentro de un `useEffect` para evitar errores de *hydration mismatch* entre servidor y cliente.
  - Generación de `sessionId` único persistente en el navegador para mantener la memoria conversacional P4.
  - Auto-scroll inteligente: baja al final cuando el usuario escribe y alinea el último mensaje del usuario arriba cuando el bot responde.
  - Atajos de teclado: `Enter` para enviar, `Shift + Enter` para salto de línea, `Escape` para cerrar.

### 10.2 Panel de Administración y Entrenamiento
- **Ruta**: `/dashboard/entrenamiento-asistente`
- **Archivos**: [src/app/dashboard/entrenamiento-asistente/page.tsx](file:///e:/ITEC/src/app/dashboard/entrenamiento-asistente/page.tsx) y `EntrenamientoForm.tsx`.
- Permite a los administradores:
  - Modificar en caliente el `system_prompt`, `temperature` y `max_tokens` almacenados en `ai_prompt_settings`.
  - Subir y eliminar documentos del bucket `training-docs`.
  - Ejecutar el re-entrenamiento y sincronización de vectores.

---

## 11. Estructura de Tablas en Supabase

| Tabla | Propósito dentro del Ecosistema de IA |
|---|---|
| `ai_prompt_settings` | Almacena los system prompts dinámicos (`asistente_global`, `sponsor_report_mensual`). Con lectura cacheada en Next.js. |
| `documents` | Almacena chunks documentales con embeddings vectoriales de 768 dimensiones (`vector(768)`). Con índice HNSW. |
| `saved_conversations` | Conversaciones históricas vectorizadas por sesión (`sessionId`) para recuperación en nivel P4. |
| `asistente_feedback` | Calificaciones (muy útil, útil, no útil, error) y comentarios de los usuarios con embedding de la conversación. |
| `asistente_aprendizajes` | Reglas y patrones aprendidos a partir del feedback para ajuste fino del prompt. |
| `asistente_embeddings` | Tabla auxiliar de vectores de caché para consultas recurrentes. |
| `chat_conocimiento` | Base de conocimiento rápida estilo FAQ para autogestión de respuestas inmediatas. |
| `ai_auditoria_violaciones` | Registro de advertencias y violaciones detectadas por el filtro de seguridad `auditarRespuestaIA`. |
| `api_settings` | Permite almacenar y rotar dinámicamente API keys desde la base de datos sin requerir re-despliegues. |

---

## 12. Gotchas, Quirks y Lecciones Aprendidas

1. **Restricción de Edge Runtime (`fs` module)**:
   - Las rutas que corren en Edge o Serverless optimizado **no pueden importar ni ejecutar el módulo `fs` de Node.js**.
   - Por esta razón, todos los documentos de `/docs` se pre-compilan en strings estáticos en [docsContext.ts](file:///e:/ITEC/src/lib/docsContext.ts) mediante el script `npm run sync-docs`.
2. **Volatilidad de Modelos Gratuitos**:
   - Los proveedores gratuitos (Groq, OpenRouter, OpenCode) apagan o renombran modelos con frecuencia.
   - *Regla:* Si el asistente arroja 502, no asumir error de código. Probar inmediatamente `GET /api/asistente/debug` con el secret de diagnóstico para ver qué provider rechazó la conexión y actualizar la constante correspondiente en `route.ts`.
3. **Dimensionalidad de Embeddings**:
   - Supabase `documents` usa `vector(768)`. El modelo `gemini-embedding-001` debe llamarse siempre con `outputDimensionality: 768` explícito. Si se usa HuggingFace como fallback (384 dims), debe completarse con ceros a la derecha hasta 768.
4. **Scraping Web sin APIs de Pago**:
   - Está prohibido integrar Serper u otros motores comerciales. Si DuckDuckGo Instant Answer no responde, se recurre a `lite.duckduckgo.com/lite/` con regex puro sobre `<td class="result-snippet">`.
5. **No inventar datos en respuestas**:
   - Si un dato numérico o fecha no existe en el contexto inyectado, el modelo debe declarar que no lo posee y orientar al usuario a contactar a ITEC o visitar el sitio web oficial.

---

## 13. Guía y Recomendaciones para Futuras Ampliaciones

Cuando otra IA o desarrollador planifique nuevas funcionalidades para la IA ITEC, se deben considerar las siguientes directrices y oportunidades:

### 13.1 Oportunidades de Mejora Recomendadas
1. **Streaming de Respuestas (Server-Sent Events / ReadableStream)**:
   - Migrar la respuesta de `POST /api/asistente` a un stream progresivo para mejorar la percepción de velocidad en el `ChatWidget`.
2. **Indexación Vectorial Incremental Automatizada**:
   - Crear un webhook o trigger en Supabase Storage para que, al subir un archivo a `training-docs`, se genere automáticamente su chunking y embedding en la tabla `documents` sin requerir scripts manuales.
3. **Soporte Multimodal (Imágenes / Planos)**:
   - Aprovechar las capacidades visuales de `gemini-3.8-flash` para que el usuario pueda adjuntar fotos o planos en el chat y la IA pueda interpretarlos visualmente.
4. **Function Calling / Herramientas para el Asistente**:
   - Dotar a la IA de herramientas para consultar el estado del tiempo en Saladillo, inscribirse a eventos o solicitar certificados directamente desde la conversación.
5. **Sub-Agentes Especializados**:
   - Conectar con agentes temáticos (Agente de Capacitaciones, Agente de Sponsors, Agente Turístico de Saladillo) mediante un router orquestador.

### 13.2 Reglas Inquebrantables para Cualquier Modificación
- ❌ **NO romper el costo $0**: Nunca reemplazar la cadena de reintentos por un único provider de pago.
- ❌ **NO quitar la prioridad de documentos propios**: El soft fallback institucional debe mantenerse siempre antes que la búsqueda web.
- ❌ **NO ignorar la preponderancia temporal**: En cualquier nueva fuente documental, el año y fecha deben ponderar el ranking del chunk.
- ❌ **NO exponer PII ni API keys en el cliente**.
- ✅ **SIEMPRE ejecutar `npm run sync-docs` y `npm run build`** antes de commitear cambios en la base de documentos o en los tipos TypeScript.
