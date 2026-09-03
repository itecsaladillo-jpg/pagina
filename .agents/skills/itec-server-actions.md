---
name: itec-server-actions
description: "Reglas obligatorias para las Server Actions en ITEC"
---

# Server Actions

Patrón obligatorio en TODAS las acciones mutativas:
1. Validar auth y rol llamando a `getCurrentMember()`.
2. Si no es admin/coordinador (según feature), rechazar.
3. Validar inputs con Zod.
4. Realizar mutación.
5. Llamar a `revalidatePath()`.
6. Retornar `{ success: true }` o `{ success: false, error: '...' }`.
