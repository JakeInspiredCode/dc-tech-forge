-- DC-Tech-Forge cloud schema. Applied by every Vercel build (scripts/db-migrate.mjs)
-- and safe to re-run: everything here is "if not exists" or "or replace".
--
-- What this is: optional accounts ("pilots") identified by a callsign and an
-- app-issued 128-bit recovery code, one private save per pilot, and the shared
-- Fleet Log. Supabase Auth is deliberately not in the loop: nobody types a
-- password they use elsewhere, and a 128-bit random secret needs no lockout to
-- resist guessing, so the whole scheme is three tables and the functions below.
--
-- The security boundary is meant to be auditable in one read: the public
-- (anon) key can call exactly the forge_* functions granted at the bottom and
-- read the fleet_log view. No table or sequence is reachable directly. Every
-- function that touches a pilot's data checks the code first (forge_auth).
-- Failed checks raise, which rolls the call back — so there is nothing to
-- count and no lockout for a stranger to trigger against someone's callsign.

create extension if not exists pgcrypto with schema extensions;

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.pilots (
  id           uuid primary key default gen_random_uuid(),
  callsign     text not null unique check (callsign ~ '^[a-z0-9_]{3,20}$'),
  code_hash    text not null,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.saves (
  pilot_id   uuid primary key references public.pilots(id) on delete cascade,
  data       jsonb not null,
  rev        integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint saves_size_cap check (pg_column_size(data) <= 4 * 1024 * 1024)
);

create table if not exists public.activity (
  id         bigint generated always as identity primary key,
  pilot_id   uuid not null references public.pilots(id) on delete cascade,
  kind       text not null check (kind in (
               'mission_accomplished', 'campaign_completed', 'badge_earned', 'speed_run',
               'session_completed', 'drill_completed', 'diagnosis_solved', 'quick_draw',
               'ticket_resolved', 'bounty_completed')),
  ref        text not null check (ref ~ '^[A-Za-z0-9_.:-]{0,64}$'),
  value      numeric check (value is null or (value >= 0 and value <= 1000000)),
  created_at timestamptz not null default now()
);
create index if not exists activity_recent_idx on public.activity (created_at desc, id desc);
create index if not exists activity_pilot_recent_idx on public.activity (pilot_id, created_at desc);

-- ── Lockdown ──────────────────────────────────────────────────────────────────
-- Row-level security on, no policies: even a stray grant returns nothing. The
-- revokes make the intent explicit and undo Supabase's default table grants.

alter table public.pilots   enable row level security;
alter table public.saves    enable row level security;
alter table public.activity enable row level security;
revoke all on table public.pilots, public.saves, public.activity from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- ── The public face of the log ────────────────────────────────────────────────
-- Callsigns and what they did, newest first. The only columns that leave the
-- tables. The client turns kind/ref into words and drops anything it can't name.

create or replace view public.fleet_log as
  select a.id, p.callsign, a.kind, a.ref, a.value, a.created_at
  from public.activity a
  join public.pilots p on p.id = a.pilot_id
  order by a.created_at desc, a.id desc
  limit 100;
grant select on public.fleet_log to anon, authenticated;

-- ── Internal helpers (not callable by anon) ───────────────────────────────────

create or replace function public.forge_check_callsign(p_callsign text)
returns void language plpgsql as $$
begin
  if p_callsign is null or p_callsign !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'CALLSIGN_INVALID';
  end if;
  -- Mirrored in lib/cloud/callsign.ts; a test keeps the two lists equal.
  if p_callsign = any (array[
    'admin', 'administrator', 'root', 'system', 'support', 'staff', 'moderator', 'mod',
    'official', 'dctf', 'dc_tech_forge', 'forge', 'jake', 'jacob', 'jakebuildsfunthings',
    'anthropic', 'claude', 'supabase', 'vercel', 'null', 'undefined', 'you', 'me',
    'anonymous', 'sample', 'demo', 'test', 'pilot', 'operator', 'fleet', 'fleet_log'
  ]) then
    raise exception 'CALLSIGN_RESERVED';
  end if;
end $$;

-- SHA-256, unsalted, on purpose: the code is 128 random bits minted by the
-- server, so a dictionary attack has nothing to work with and slow hashing
-- would only slow every call. The hash protects against a database leak.
create or replace function public.forge_hash(p_code text)
returns text language sql immutable
set search_path = public, extensions, pg_temp as $$
  select encode(extensions.digest(convert_to(p_code, 'UTF8'), 'sha256'), 'hex')
$$;

create or replace function public.forge_new_code()
returns text language sql volatile
set search_path = public, extensions, pg_temp as $$
  select encode(extensions.gen_random_bytes(16), 'hex')
$$;

-- The pilot's id if the code is right; raises otherwise.
create or replace function public.forge_auth(p_callsign text, p_code text)
returns uuid language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_id uuid;
begin
  if p_callsign is null or p_code is null or length(p_code) <> 32 then
    raise exception 'AUTH_FAILED';
  end if;
  select id into v_id from public.pilots
    where callsign = p_callsign and code_hash = public.forge_hash(p_code);
  if v_id is null then
    raise exception 'AUTH_FAILED';
  end if;
  update public.pilots set last_seen_at = now() where id = v_id;
  return v_id;
end $$;

-- ── Public functions (the whole API) ──────────────────────────────────────────

-- Claim a callsign. Returns the recovery code, which is shown once and never
-- stored in clear anywhere.
create or replace function public.forge_register(p_callsign text)
returns json language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_code text;
  v_id uuid;
begin
  perform public.forge_check_callsign(p_callsign);
  -- A bot with the public key could otherwise fill the table.
  if (select count(*) from public.pilots where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'RATE_LIMITED';
  end if;
  if exists (select 1 from public.pilots where callsign = p_callsign) then
    raise exception 'CALLSIGN_TAKEN';
  end if;
  v_code := public.forge_new_code();
  insert into public.pilots (callsign, code_hash) values (p_callsign, public.forge_hash(v_code))
    returning id into v_id;
  return json_build_object('pilot_id', v_id, 'code', v_code);
exception when unique_violation then
  raise exception 'CALLSIGN_TAKEN';
end $$;

create or replace function public.forge_sign_in(p_callsign text, p_code text)
returns json language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_id uuid;
  v_rev integer;
  v_updated timestamptz;
begin
  v_id := public.forge_auth(p_callsign, p_code);
  select rev, updated_at into v_rev, v_updated from public.saves where pilot_id = v_id;
  return json_build_object('pilot_id', v_id, 'save_rev', coalesce(v_rev, 0), 'save_updated_at', v_updated);
end $$;

-- Replace the pilot's save. Last writer wins; the returned rev tells a client
-- whether someone else has written since it last looked.
create or replace function public.forge_save(p_callsign text, p_code text, p_data jsonb)
returns json language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_id uuid;
  v_rev integer;
begin
  v_id := public.forge_auth(p_callsign, p_code);
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'SAVE_INVALID';
  end if;
  if exists (select 1 from public.saves where pilot_id = v_id and updated_at > now() - interval '1 second') then
    raise exception 'RATE_LIMITED';
  end if;
  insert into public.saves (pilot_id, data) values (v_id, p_data)
    on conflict (pilot_id) do update
      set data = excluded.data, rev = public.saves.rev + 1, updated_at = now()
    returning rev into v_rev;
  return json_build_object('rev', v_rev);
exception when check_violation then
  raise exception 'SAVE_TOO_LARGE';
end $$;

create or replace function public.forge_load(p_callsign text, p_code text)
returns json language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_id uuid;
  v_data jsonb;
  v_rev integer;
  v_updated timestamptz;
begin
  v_id := public.forge_auth(p_callsign, p_code);
  select data, rev, updated_at into v_data, v_rev, v_updated from public.saves where pilot_id = v_id;
  if v_rev is null then
    return json_build_object('data', null, 'rev', 0, 'updated_at', null);
  end if;
  return json_build_object('data', v_data, 'rev', v_rev, 'updated_at', v_updated);
end $$;

-- One Fleet Log row. The kind/ref/value checks live on the table.
create or replace function public.forge_log(p_callsign text, p_code text, p_kind text, p_ref text, p_value numeric)
returns json language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_id uuid;
  v_row bigint;
begin
  v_id := public.forge_auth(p_callsign, p_code);
  if (select count(*) from public.activity where pilot_id = v_id and created_at > now() - interval '1 hour') >= 120 then
    raise exception 'RATE_LIMITED';
  end if;
  insert into public.activity (pilot_id, kind, ref, value) values (v_id, p_kind, p_ref, p_value)
    returning id into v_row;
  return json_build_object('id', v_row);
exception when check_violation then
  raise exception 'ACTIVITY_INVALID';
end $$;

create or replace function public.forge_rotate_code(p_callsign text, p_code text)
returns json language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_id uuid;
  v_code text;
begin
  v_id := public.forge_auth(p_callsign, p_code);
  v_code := public.forge_new_code();
  update public.pilots set code_hash = public.forge_hash(v_code) where id = v_id;
  return json_build_object('code', v_code);
end $$;

-- Deletes the pilot, the save and every log row (cascade).
create or replace function public.forge_delete_account(p_callsign text, p_code text)
returns json language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_id uuid;
begin
  v_id := public.forge_auth(p_callsign, p_code);
  delete from public.pilots where id = v_id;
  return json_build_object('deleted', true);
end $$;

-- ── Grants: the whole surface the public key can reach ────────────────────────

revoke all on function public.forge_check_callsign(text)              from public, anon, authenticated;
revoke all on function public.forge_hash(text)                        from public, anon, authenticated;
revoke all on function public.forge_new_code()                        from public, anon, authenticated;
revoke all on function public.forge_auth(text, text)                  from public, anon, authenticated;
revoke all on function public.forge_register(text)                    from public;
revoke all on function public.forge_sign_in(text, text)               from public;
revoke all on function public.forge_save(text, text, jsonb)           from public;
revoke all on function public.forge_load(text, text)                  from public;
revoke all on function public.forge_log(text, text, text, text, numeric) from public;
revoke all on function public.forge_rotate_code(text, text)           from public;
revoke all on function public.forge_delete_account(text, text)        from public;

grant execute on function public.forge_register(text)                    to anon, authenticated;
grant execute on function public.forge_sign_in(text, text)               to anon, authenticated;
grant execute on function public.forge_save(text, text, jsonb)           to anon, authenticated;
grant execute on function public.forge_load(text, text)                  to anon, authenticated;
grant execute on function public.forge_log(text, text, text, text, numeric) to anon, authenticated;
grant execute on function public.forge_rotate_code(text, text)           to anon, authenticated;
grant execute on function public.forge_delete_account(text, text)        to anon, authenticated;

-- PostgREST caches the schema; tell it to look again.
notify pgrst, 'reload schema';
