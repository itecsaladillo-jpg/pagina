-- ============================================================
-- ITEC Augusto Cicaré - Migración 026: Sistema de Eventos Presenciales QR Unificado
-- ============================================================

-- 1. Tabla de Eventos Presenciales
create table if not exists public.eventos (
  id                  uuid primary key default gen_random_uuid(),
  nombre_evento       text not null,
  fecha               timestamptz not null default now(),
  slug_qr             text not null unique,
  estado_activo       boolean not null default true,
  modalidad           text not null default 'presencial'
                        check (modalidad in ('presencial', 'virtual')),
  
  -- Orquestación de Herramientas en Vivo para los Asistentes
  herramienta_activa  text not null default 'encuestas'
                        check (herramienta_activa in ('encuestas', 'preguntas', 'nube_ideas')),
  encuesta_activa_id  uuid, -- FK circular opcional al id de eventos_encuestas
  nube_activa_id      uuid, -- FK circular opcional al id de otra tabla si se requiere
  
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 2. Tabla de Asistentes del Evento (Pre-acreditación y registro en puerta)
create table if not exists public.eventos_asistentes (
  id                      uuid primary key default gen_random_uuid(),
  evento_id               uuid not null references public.eventos(id) on delete cascade,
  nombre_completo         text not null,
  email                   text not null,
  telefono                text,
  organizacion_o_escuela  text,
  creado_en               timestamptz not null default now(),
  
  -- Evitar duplicados del mismo asistente en el mismo evento
  constraint eventos_asistentes_evento_email_unique unique (evento_id, email)
);

-- 3. Tabla de Preguntas Formuladas por la Audiencia (Q&A)
create table if not exists public.eventos_preguntas (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  nombre      text not null default 'Anónimo',
  pregunta    text not null,
  aprobada    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 4. Tabla de Likes a Preguntas de la Audiencia
create table if not exists public.eventos_preguntas_likes (
  id              uuid primary key default gen_random_uuid(),
  pregunta_id     uuid not null references public.eventos_preguntas(id) on delete cascade,
  dispositivo_id  text not null,
  created_at      timestamptz not null default now(),
  
  -- Limitar a un solo like por dispositivo por pregunta
  constraint eventos_preguntas_likes_unique unique (pregunta_id, dispositivo_id)
);

-- 5. Tabla de Encuestas del Evento
create table if not exists public.eventos_encuestas (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  pregunta    text not null,
  activa      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Relacionar el campo circular de eventos
alter table public.eventos 
  add constraint FK_eventos_encuesta_activa 
  foreign key (encuesta_activa_id) references public.eventos_encuestas(id) on delete set null;

-- 6. Tabla de Opciones de Encuestas
create table if not exists public.eventos_encuestas_opciones (
  id            uuid primary key default gen_random_uuid(),
  encuesta_id   uuid not null references public.eventos_encuestas(id) on delete cascade,
  texto_opcion  text not null,
  created_at    timestamptz not null default now()
);

-- 7. Tabla de Votos de Encuestas por los Asistentes
create table if not exists public.eventos_encuestas_votos (
  id              uuid primary key default gen_random_uuid(),
  opcion_id       uuid not null references public.eventos_encuestas_opciones(id) on delete cascade,
  dispositivo_id  text not null,
  created_at      timestamptz not null default now(),
  
  -- Evitar que un dispositivo vote múltiples veces en la misma opción
  constraint eventos_encuestas_votos_unique unique (opcion_id, dispositivo_id)
);

-- 8. Tabla de Palabras Clave de la Nube de Ideas
create table if not exists public.eventos_nube_palabras (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid not null references public.eventos(id) on delete cascade,
  palabra         text not null,
  dispositivo_id  text not null,
  created_at      timestamptz not null default now(),
  
  -- Limitar a una palabra por dispositivo en cada evento
  constraint eventos_nube_palabras_unique unique (evento_id, dispositivo_id)
);

-- 9. Trigger para actualizar 'updated_at' en eventos
create or replace function public.handle_updated_at_eventos()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_eventos
  before update on public.eventos
  for each row execute function public.handle_updated_at_eventos();

-- ============================================================
-- SEGURIDAD: Seguridad a Nivel de Fila (RLS) y Políticas
-- ============================================================

alter table public.eventos enable row level security;
alter table public.eventos_asistentes enable row level security;
alter table public.eventos_preguntas enable row level security;
alter table public.eventos_preguntas_likes enable row level security;
alter table public.eventos_encuestas enable row level security;
alter table public.eventos_encuestas_opciones enable row level security;
alter table public.eventos_encuestas_votos enable row level security;
alter table public.eventos_nube_palabras enable row level security;

-- Políticas públicas para Eventos
create policy "Permitir ver eventos activos a todos"
  on public.eventos for select
  using (estado_activo = true);

create policy "Permitir gestión total a miembros autenticados"
  on public.eventos for all
  using (exists (select 1 from public.members where id = auth.uid()));

-- Políticas para Asistentes
create policy "Cualquiera puede registrarse como asistente"
  on public.eventos_asistentes for insert
  with check (true);

create policy "Cualquiera puede verificar si es asistente"
  on public.eventos_asistentes for select
  using (true);

create policy "Permitir gestión de asistentes al staff"
  on public.eventos_asistentes for all
  using (exists (select 1 from public.members where id = auth.uid()));

-- Políticas para Preguntas
create policy "Cualquiera puede formular preguntas"
  on public.eventos_preguntas for insert
  with check (true);

create policy "Cualquiera puede ver preguntas aprobadas"
  on public.eventos_preguntas for select
  using (aprobada = true or exists (select 1 from public.members where id = auth.uid()));

create policy "Permitir gestión de preguntas al staff"
  on public.eventos_preguntas for all
  using (exists (select 1 from public.members where id = auth.uid()));

-- Políticas para Likes de Preguntas
create policy "Cualquiera puede ver likes de preguntas"
  on public.eventos_preguntas_likes for select
  using (true);

create policy "Cualquiera puede dar like a preguntas"
  on public.eventos_preguntas_likes for insert
  with check (true);

-- Políticas para Encuestas y Opciones
create policy "Cualquiera puede ver encuestas"
  on public.eventos_encuestas for select
  using (true);

create policy "Permitir gestión de encuestas al staff"
  on public.eventos_encuestas for all
  using (exists (select 1 from public.members where id = auth.uid()));

create policy "Cualquiera puede ver opciones de encuesta"
  on public.eventos_encuestas_opciones for select
  using (true);

create policy "Permitir gestión de opciones de encuesta al staff"
  on public.eventos_encuestas_opciones for all
  using (exists (select 1 from public.members where id = auth.uid()));

-- Políticas para Votos de Encuestas
create policy "Cualquiera puede ver votos de encuesta"
  on public.eventos_encuestas_votos for select
  using (true);

create policy "Cualquiera puede votar en encuesta"
  on public.eventos_encuestas_votos for insert
  with check (true);

-- Políticas para Nube de Ideas
create policy "Cualquiera puede ver palabras de la nube"
  on public.eventos_nube_palabras for select
  using (true);

create policy "Cualquiera puede aportar a la nube de ideas"
  on public.eventos_nube_palabras for insert
  with check (true);

create policy "Permitir gestión de nube de ideas al staff"
  on public.eventos_nube_palabras for all
  using (exists (select 1 from public.members where id = auth.uid()));

-- ============================================================
-- SUPABASE REALTIME: Activar publicaciones Realtime
-- ============================================================

alter publication supabase_realtime add table public.eventos;
alter publication supabase_realtime add table public.eventos_preguntas;
alter publication supabase_realtime add table public.eventos_preguntas_likes;
alter publication supabase_realtime add table public.eventos_encuestas;
alter publication supabase_realtime add table public.eventos_encuestas_votos;
alter publication supabase_realtime add table public.eventos_nube_palabras;
