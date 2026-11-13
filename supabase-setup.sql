-- =====================================================================
-- «Раскрой онлайн»: база данных пользователей (Supabase, PostgreSQL)
-- Как запустить: Supabase → SQL Editor → New query → вставить ВЕСЬ этот файл → Run.
-- Скрипт можно запускать повторно: уже созданное он не ломает.
-- Подробная инструкция: SETUP-SUPABASE.txt
-- =====================================================================

-- ---------- Таблицы ----------

-- Профиль пользователя (одна строка на аккаунт)
create table if not exists public.profiles (
    id             uuid primary key references auth.users (id) on delete cascade,
    login          text not null,                    -- логин, как его ввёл человек
    login_key      text not null,                    -- он же в нижнем регистре (для поиска и уникальности)
    is_admin       boolean not null default false,   -- главный админ
    blocked        boolean not null default false,   -- заблокирован
    blocked_reason text,
    blocked_at     timestamptz,
    look           jsonb not null default '{}'::jsonb,  -- оформление: аватарка, рамка, титул, статус, «о себе»
    works_count    integer not null default 0,       -- сколько у человека работ (для админ-панели)
    created_at     timestamptz not null default now(),
    last_seen      timestamptz not null default now(),
    constraint profiles_login_len check (char_length(login) between 2 and 30),
    constraint profiles_look_size check (octet_length(look::text) < 60000)
);
create unique index if not exists profiles_login_key_uq on public.profiles (login_key);
create unique index if not exists profiles_login_lower_uq on public.profiles (lower(login));

-- Работы и ткани пользователя (всё, что он сделал в приложении)
create table if not exists public.user_data (
    user_id    uuid primary key references auth.users (id) on delete cascade,
    projects   jsonb,
    fabric     jsonb,
    updated_at timestamptz not null default now()
);

-- Логины, которые автоматически становятся главными админами при регистрации.
-- ВАЖНО: админом станет тот, кто первым зарегистрирует такой логин. Зарегистрируйтесь сразу после запуска скрипта.
create table if not exists public.admin_logins (
    login_key text primary key
);
insert into public.admin_logins (login_key) values ('madaminov712.') on conflict do nothing;

-- ---------- Вспомогательные функции ----------

create or replace function public.is_admin_user() returns boolean
language sql stable security definer set search_path = public as $$
    select coalesce((select p.is_admin and not p.blocked from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_blocked_user() returns boolean
language sql stable security definer set search_path = public as $$
    select coalesce((select p.blocked from public.profiles p where p.id = auth.uid()), false);
$$;

-- ---------- Создание профиля при регистрации ----------
-- Логин приходит из приложения (метаданные), а адрес почты в Auth — это «отпечаток» логина.
-- Триггер сверяет их, поэтому нельзя зарегистрироваться под чужим логином и получить права админа.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
    lg text := btrim(coalesce(new.raw_user_meta_data ->> 'login', ''));
    lk text := coalesce(new.raw_user_meta_data ->> 'login_key', '');
    fp text;
begin
    if char_length(lg) < 2 or char_length(lg) > 30 or lk = '' then
        raise exception 'bad login';
    end if;
    fp := 'h' || substr(encode(sha256(convert_to(lk, 'UTF8')), 'hex'), 1, 32);
    if split_part(lower(new.email), '@', 1) <> fp then
        raise exception 'login does not match account';
    end if;
    insert into public.profiles (id, login, login_key, is_admin)
    values (new.id, lg, lk, exists (select 1 from public.admin_logins a where a.login_key = lk));
    return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------- Защита служебных полей ----------
-- Обычный пользователь не может сам себя сделать админом, снять блокировку или сменить логин.
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    -- auth.uid() пусто, когда правку делает владелец проекта из SQL Editor: ему можно всё
    if auth.uid() is not null and not public.is_admin_user() then
        new.is_admin := old.is_admin;
        new.blocked := old.blocked;
        new.blocked_reason := old.blocked_reason;
        new.blocked_at := old.blocked_at;
    end if;
    if auth.uid() is not null then
        new.id := old.id;
        new.login := old.login;
        new.login_key := old.login_key;
        new.created_at := old.created_at;
    end if;
    return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
    for each row execute function public.protect_profile();

create or replace function public.touch_user_data() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end $$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch before insert or update on public.user_data
    for each row execute function public.touch_user_data();

-- ---------- Права доступа (RLS) ----------
alter table public.profiles     enable row level security;
alter table public.user_data    enable row level security;
alter table public.admin_logins enable row level security;   -- без политик: никому не виден

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
    using (id = auth.uid() or public.is_admin_user());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
    using (id = auth.uid() and not blocked) with check (id = auth.uid());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated
    using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists user_data_select on public.user_data;
create policy user_data_select on public.user_data for select to authenticated
    using (user_id = auth.uid());

drop policy if exists user_data_insert on public.user_data;
create policy user_data_insert on public.user_data for insert to authenticated
    with check (user_id = auth.uid() and not public.is_blocked_user());

drop policy if exists user_data_update on public.user_data;
create policy user_data_update on public.user_data for update to authenticated
    using (user_id = auth.uid() and not public.is_blocked_user())
    with check (user_id = auth.uid() and not public.is_blocked_user());

revoke all on public.profiles, public.user_data, public.admin_logins from anon;
revoke all on public.admin_logins from authenticated;

-- ---------- Функции для приложения ----------

-- Блокировка и разблокировка (только админ). Заодно закрывает вход в Auth, чтобы заблокированный не мог зайти.
create or replace function public.admin_set_blocked(target uuid, do_block boolean, why text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
    if not public.is_admin_user() then raise exception 'forbidden'; end if;
    if exists (select 1 from public.profiles where id = target and is_admin) then
        raise exception 'cannot block admin';
    end if;
    update public.profiles
       set blocked = do_block,
           blocked_reason = case when do_block then left(coalesce(why, ''), 200) else null end,
           blocked_at = case when do_block then now() else null end
     where id = target;
    update auth.users
       set banned_until = case when do_block then now() + interval '100 years' else null end
     where id = target;
end $$;

-- Человек удаляет свой аккаунт целиком (заблокированным нельзя, чтобы не обходить блокировку)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'forbidden'; end if;
    if public.is_blocked_user() then raise exception 'blocked'; end if;
    delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.admin_set_blocked(uuid, boolean, text) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.admin_set_blocked(uuid, boolean, text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function public.is_admin_user(), public.is_blocked_user() from public, anon;
grant execute on function public.is_admin_user(), public.is_blocked_user() to authenticated;

-- Готово. Дальше: SETUP-SUPABASE.txt, шаги 3–6.
