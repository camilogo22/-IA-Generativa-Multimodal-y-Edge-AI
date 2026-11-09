-- ==============================================================================
-- Migración Guía Semana 10: Tutor IA & GeoCam con IA
-- ==============================================================================

-- 1. Tabla uso_ia (Reto C5: Límite diario por usuario)
-- Permite contar cuántas peticiones ha realizado cada usuario en las últimas 24 horas.
create table if not exists public.uso_ia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  funcion text not null default 'tutor',
  created_at timestamptz not null default now()
);

-- Habilitar Row Level Security (RLS)
alter table public.uso_ia enable row level security;

-- Políticas de RLS:
-- Los usuarios solo pueden ver sus propios registros
create policy "Usuarios ven su propio uso"
  on public.uso_ia
  for select
  using (auth.uid() = user_id);

-- Los usuarios solo pueden registrar su propio uso (sin posibilidad de borrar ni editar)
create policy "Usuarios insertan su propio uso"
  on public.uso_ia
  for insert
  with check (auth.uid() = user_id);

-- Índice para acelerar el conteo de las últimas 24 horas por usuario
create index if not exists idx_uso_ia_user_fecha
  on public.uso_ia (user_id, created_at desc);

-- 2. Columna ai_description en tabla photos (Taller GeoCam ve - Requisito T3)
-- Agrega el campo para almacenar la descripción generada por Gemini
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  url text,
  latitude double precision,
  longitude double precision,
  ai_description text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- En caso de que la tabla photos ya existiera de la semana 9:
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'photos' and column_name = 'ai_description'
  ) then
    alter table public.photos add column ai_description text;
  end if;
end $$;
