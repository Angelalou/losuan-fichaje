-- Esquema de la app de fichaje LOSUAN Limpiezas (Supabase / PostgreSQL)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  email text not null default '',
  rol text not null default 'empleada' check (rol in ('admin', 'empleada')),
  activa boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fichajes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  entrada timestamptz not null,
  salida timestamptz,
  manual boolean not null default false,
  motivo text,
  corregido_por uuid references public.profiles (id),
  corregido_en timestamptz,
  created_at timestamptz not null default now(),
  constraint salida_posterior check (salida is null or salida >= entrada)
);

create index if not exists fichajes_user_entrada on public.fichajes (user_id, entrada desc);
create unique index if not exists un_fichaje_abierto on public.fichajes (user_id) where salida is null;

-- Copia de los valores anteriores cada vez que se corrige un fichaje
create table if not exists public.fichajes_historial (
  id bigint generated always as identity primary key,
  fichaje_id bigint not null references public.fichajes (id),
  entrada_anterior timestamptz,
  salida_anterior timestamptz,
  entrada_nueva timestamptz,
  salida_nueva timestamptz,
  motivo text,
  cambiado_por uuid references public.profiles (id),
  cambiado_en timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and rol = 'admin' and activa);
$$;

-- La primera persona que se registra es la administradora; el resto queda pendiente de activar
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  hay_admin boolean;
begin
  perform pg_advisory_xact_lock(4242);
  select exists (select 1 from profiles where rol = 'admin') into hay_admin;
  insert into profiles (id, nombre, email, rol, activa)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.email, ''),
    case when hay_admin then 'empleada' else 'admin' end,
    not hay_admin
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fichar: la hora la pone siempre el servidor, nunca el móvil
create or replace function public.fichar_entrada()
returns public.fichajes
language plpgsql security definer set search_path = public
as $$
declare
  r fichajes;
begin
  if not exists (select 1 from profiles where id = auth.uid() and activa) then
    raise exception 'Tu cuenta no está activa';
  end if;
  if exists (select 1 from fichajes where user_id = auth.uid() and salida is null) then
    raise exception 'Ya tienes una entrada abierta. Ficha la salida primero.';
  end if;
  insert into fichajes (user_id, entrada) values (auth.uid(), now()) returning * into r;
  return r;
end;
$$;

create or replace function public.fichar_salida()
returns public.fichajes
language plpgsql security definer set search_path = public
as $$
declare
  r fichajes;
begin
  if not exists (select 1 from profiles where id = auth.uid() and activa) then
    raise exception 'Tu cuenta no está activa';
  end if;
  update fichajes set salida = now()
  where user_id = auth.uid() and salida is null
  returning * into r;
  if r.id is null then
    raise exception 'No tienes ninguna entrada abierta';
  end if;
  return r;
end;
$$;

-- Correcciones de la administradora (siempre con motivo y quedan registradas)
create or replace function public.crear_fichaje_manual(p_user uuid, p_entrada timestamptz, p_salida timestamptz, p_motivo text)
returns public.fichajes
language plpgsql security definer set search_path = public
as $$
declare
  r fichajes;
begin
  if not is_admin() then raise exception 'Solo la administradora puede hacer esto'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'Indica el motivo'; end if;
  insert into fichajes (user_id, entrada, salida, manual, motivo, corregido_por, corregido_en)
  values (p_user, p_entrada, p_salida, true, p_motivo, auth.uid(), now())
  returning * into r;
  insert into fichajes_historial (fichaje_id, entrada_nueva, salida_nueva, motivo, cambiado_por)
  values (r.id, p_entrada, p_salida, p_motivo, auth.uid());
  return r;
end;
$$;

create or replace function public.corregir_fichaje(p_id bigint, p_entrada timestamptz, p_salida timestamptz, p_motivo text)
returns public.fichajes
language plpgsql security definer set search_path = public
as $$
declare
  antes fichajes;
  r fichajes;
begin
  if not is_admin() then raise exception 'Solo la administradora puede hacer esto'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'Indica el motivo'; end if;
  select * into antes from fichajes where id = p_id for update;
  if antes.id is null then raise exception 'Fichaje no encontrado'; end if;
  update fichajes
  set entrada = p_entrada, salida = p_salida, manual = true, motivo = p_motivo,
      corregido_por = auth.uid(), corregido_en = now()
  where id = p_id
  returning * into r;
  insert into fichajes_historial (fichaje_id, entrada_anterior, salida_anterior, entrada_nueva, salida_nueva, motivo, cambiado_por)
  values (p_id, antes.entrada, antes.salida, p_entrada, p_salida, p_motivo, auth.uid());
  return r;
end;
$$;

alter table public.profiles enable row level security;
alter table public.fichajes enable row level security;
alter table public.fichajes_historial enable row level security;

drop policy if exists "ver perfil propio o admin" on public.profiles;
create policy "ver perfil propio o admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "admin actualiza perfiles" on public.profiles;
create policy "admin actualiza perfiles" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ver fichajes propios o admin" on public.fichajes;
create policy "ver fichajes propios o admin" on public.fichajes
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin ve historial" on public.fichajes_historial;
create policy "admin ve historial" on public.fichajes_historial
  for select using (public.is_admin());

-- Nadie escribe directamente en las tablas: solo a través de las funciones de arriba
revoke insert, update, delete on public.fichajes from anon, authenticated;
revoke insert, update, delete on public.fichajes_historial from anon, authenticated;
revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (nombre, rol, activa) on public.profiles to authenticated;

revoke execute on function public.fichar_entrada() from anon;
revoke execute on function public.fichar_salida() from anon;
revoke execute on function public.crear_fichaje_manual(uuid, timestamptz, timestamptz, text) from anon;
revoke execute on function public.corregir_fichaje(bigint, timestamptz, timestamptz, text) from anon;
