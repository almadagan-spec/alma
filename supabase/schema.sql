-- Alma database schema: real accounts, restaurant lists, and sharing.
-- Run this once in the Supabase SQL Editor for a fresh project.

create extension if not exists pgcrypto;

-- One row per signed-up user, holding the app-specific fields the signup
-- form collects beyond what Supabase Auth already stores (email, password).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by their owner or someone they share a list with"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.list_shares
      where list_shares.owner_id = profiles.id
        and lower(list_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Auto-create a profile row right after Supabase Auth creates the user,
-- pulling full_name/phone out of the signup call's metadata.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Restaurant list shares: who a user's list has been shared with, by email.
create table public.list_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  shared_with_email text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, shared_with_email)
);

alter table public.list_shares enable row level security;

create policy "Owners see who they've shared with; recipients see shares aimed at them"
  on public.list_shares for select
  using (
    owner_id = auth.uid()
    or lower(shared_with_email) = lower(auth.jwt() ->> 'email')
  );

create policy "Owners can share their own list"
  on public.list_shares for insert
  with check (owner_id = auth.uid());

-- Restaurant list items. owner_id identifies whose list a row belongs to,
-- regardless of who actually inserted/edited it (the owner or someone the
-- list was shared with).
create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  place_id text not null,
  name text not null,
  address text,
  checked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (owner_id, place_id)
);

alter table public.list_items enable row level security;

create policy "Owners and people the list is shared with can view items"
  on public.list_items for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.list_shares
      where list_shares.owner_id = list_items.owner_id
        and lower(list_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Owners and people the list is shared with can add items"
  on public.list_items for insert
  with check (
    owner_id = auth.uid()
    or exists (
      select 1 from public.list_shares
      where list_shares.owner_id = list_items.owner_id
        and lower(list_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Owners and people the list is shared with can update items"
  on public.list_items for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.list_shares
      where list_shares.owner_id = list_items.owner_id
        and lower(list_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
    )
  );
