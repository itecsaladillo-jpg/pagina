---
name: itec-supabase-clients
description: "Patrones de clientes Supabase del proyecto ITEC"
---

# Supabase Clients (ITEC)

Existen 3 patrones coexistentes:
1. `src/lib/supabase/server.ts`: Para Server Components y Actions. Usa `createServerClient`. Siempre asíncrono (`await createClient()`).
2. `src/lib/supabase/client.ts`: Para Client Components. Usa `createBrowserClient`.
3. Cliente crudo `@supabase/supabase-js`: Casos legacy.

Regla de oro: No mezclar los patrones y forzar el uso de `lib/supabase/server.ts` para código nuevo en el servidor.
