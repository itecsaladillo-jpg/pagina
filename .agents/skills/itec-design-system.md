---
name: itec-design-system
description: "Directrices de diseño visual, sistema estético, paleta, animaciones y glassmorphism de ITEC"
---

# Design System y Estética Visual (ITEC Saladillo)

Basado en `src/app/globals.css` y las directrices visuales de `ITEC_CODEGUIDE.md`:

## 1. Filosofía Estética
**Técnica · Humana · Vanguardista**
- Interfaz inmersiva con temática oscura profunda, acentos lumínicos neón y toques cálidos que reflejan comunidad y tecnología.

## 2. Tokens de Color y Paleta Oficial
- **Fondos:**
  - `--bg-deep` (`#030712`): Fondo base de toda la plataforma.
  - `--bg-surface` (`#0a0f1e`): Superficies intermedias, barras de navegación y modales.
  - `--bg-card` (`#0f1729`): Contenedores de contenido y tarjetas principales.
  - `--bg-card-hover` (`#151e35`): Estado hover de tarjetas interactivas.
- **Acentos Lumínicos:**
  - Azul Eléctrico Primario: `--accent-primary` (`#3b82f6`) y `--accent-primary-2` (`#60a5fa`).
  - Cyan Tecnológico: `--accent-cyan` (`#06b6d4`) y `--accent-cyan-2` (`#22d3ee`).
  - Ámbar Calidez Humana: `--accent-warm` (`#f59e0b`) y `--accent-warm-2` (`#fbbf24`).
- **Textos:**
  - `--text-primary` (`#f1f5f9`): Títulos y textos de alto contraste.
  - `--text-secondary` (`#94a3b8`): Descripciones y metadatos secundarios.
  - `--text-muted` (`#475569`): Placeholders y etiquetas inactivas.
- **Bordes y Brillos:**
  - `--border-subtle` (`rgba(99, 179, 237, 0.08)`): Líneas divisorias estándar.
  - `--border-glow` (`rgba(59, 130, 246, 0.3)`): Resplandor activo en foco y hover.

## 3. Glassmorphism y Elevación
- Clase `.glass`:
  - `background: rgba(15, 23, 41, 0.6)`
  - `backdrop-filter: blur(16px)`
  - Borde sutil `1px solid var(--border-subtle)`
- Clase `.card-hover`:
  - `transform: translateY(-4px)`
  - Sombra difusa `box-shadow: 0 20px 60px rgba(59, 130, 246, 0.15)`
  - Borde iluminado con `var(--border-glow)`

## 4. Tipografía y Gradientes
- Fuente oficial: **Inter** (configurada con variable CSS `--font-inter` y `antialiased`).
- Títulos destacados con `.text-gradient`:
  - Degradado animado 135deg entre azul eléctrico, cyan y ámbar con `gradient-shift 5s ease infinite`.
  - Títulos con efecto reflector (`spotlight-ltr` y `spotlight-rtl`).

## 5. Motion Design y Animaciones
- **Framer Motion:**
  - Usar para transiciones de montaje/desmontaje (`AnimatePresence`), estados hover interactivos (`whileHover={{ scale: 1.02 }}`), gestos táctiles (`whileTap={{ scale: 0.98 }}`) y animaciones de resorte (`type: "spring", stiffness: 300, damping: 20`).
- **Animaciones CSS utilitarias:**
  - `.animate-marquee-infinite`: Marquesina continua de sponsors (velocidad calibrada 63s linear).
  - `.animate-float`: Flotación suave para insignias y elementos hero.
  - `.animate-pulse-glow`: Pulso para emisiones en vivo y streaming activo.
  - `.animate-fade-up` y `.animate-slide-up`: Entrada suave de secciones y modales.

## 6. Jerarquía Visual de Sponsors y Partners
- Alturas obligatorias para logotipos según tier en `NuestrosSociosSection`:
  - **Platino:** `h-24` (máximo impacto y presencia).
  - **Oro:** `h-20`.
  - **Plata:** `h-16`.
  - **Bronce / Standard:** `h-12`.
- Soporte para versiones `logo_color_url` y `logo_monocromo_url`.

## 7. Responsividad y Pantallas Especiales
- Diseño completamente fluido desde móviles (360px) hasta monitores ultrawide.
- Soporte para **Modo Pantalla Gigante** (`modo_pantalla_gigante`) en eventos presenciales: tipografías de alto tamaño (display XL), contraste reforzado para proyectores y lectura a distancia.
