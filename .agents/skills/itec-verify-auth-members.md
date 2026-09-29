---
name: itec-verify-auth-members
description: "Checklist de verificación de autenticación y miembros en ITEC"
---

# Verificación de Autenticación y Miembros

## Flujo OAuth
- [ ] Login: `supabase.auth.signInWithOAuth({ provider: 'google' })` desde Navbar o `MembersAccessButton`
- [ ] Callback: `/auth/callback/route.ts` → intercambia `code` por sessión
- [ ] Verifica `status` del miembro en tabla `members`: pendiente → signOut + home; activo → `/dashboard/muro`
- [ ] Signout: POST `/auth/signout` → redirige a `/login?logout=true`
- [ ] Proxy `src/proxy.ts`: intercepta `?code=` si el path NO es `/auth/callback`

## Pre-aprobación y Trigger DB
- [ ] Emails en tabla `allowed_emails` → auto-aprobarse
- [ ] Si no están en `allowed_emails` → `status = 'pendiente'`
- [ ] Trigger `handle_new_user()`:
  - Crea registro en `members` al crear usuario en `auth.users`
  - Verifica `allowed_emails`
  - Asigna rol y comisión automáticamente
  - No permite auto-asignación de roles
- [ ] No hay login por contraseña. Solo Google OAuth.

## Roles y Permisos
| Rol | Acceso | Restricciones |
|-----|--------|---------------|
| `admin` | Total | Acceso completo a todas las herramientas |
| `coordinador` | Amplio | Similar a admin, limitado a su comisión |
| `miembro` | Básico | Muro, perfil, drive, reuniones, ideas, certificados, aula virtual |
| `colaborador` | Restringido | Solo lectura en áreas específicas |

## Protecciones del Proxy
- [ ] `PROTECTED_ROUTES = ['/dashboard']` → sin usuario redirige a `/login?redirectTo={pathname}`
- [ ] Con usuario → consulta `members` (role, status): si no existe o `status !== 'activo'` → redirige a `/acceso-pendiente`
- [ ] Si pathname exacto `/dashboard` y activo → redirige a `/dashboard/muro`
- [ ] `AUTH_ONLY_ROUTES = ['/login', '/register']` → si hay sessión redirige a `/dashboard`
- [ ] `config.matcher`: excluye `_next/static`, `_next/image`, favicon, imágenes, y **excluye explícitamente `api/chat` y `api/asistente`**

## Tablas de Miembros
- [ ] `members`: `id(uuid PK→auth.users)`, `full_name`, `email(UNIQUE)`, `avatar_url`, `role`, `status`, `bio`, `linkedin_url`, `phone`, `join_date`, `frase_itec`, `tareas_itec`
- [ ] `commissions`: `name`, `slug(UNIQUE)`, `description`, `icon`, `color`, `is_active`, `coordinator_id(FK→members)`, `meet_link`, `drive_folder_id`
- [ ] `commission_members`: Unique(commission_id, member_id), `is_coordinator`
- [ ] `allowed_emails`: `email(UNIQUE)`, `role`, `commission_id`

## Servicios de Auth
- [ ] `getCurrentMember(): Promise<Member | null>` → usuario autenticado + fila en `members` en una sola llamada
- [ ] `hasRole(member, roles)` → verifica pertenencia a lista de roles
- [ ] `isAdmin(member)` → shortcut para rol `admin`