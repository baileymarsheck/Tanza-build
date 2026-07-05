-- Tanza Fellowship Hub — base schema (scaffold step)
--
-- Run this in your Supabase project's SQL editor after creating the project.
-- This is intentionally minimal: just enough to back the "view as" role
-- switcher. Real Fellowship features (modules, classes, assessments, etc.)
-- will add their own tables and reference profiles.id as the user identity.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('admin', 'fellow')),
  created_at timestamptz not null default now()
);

-- Row Level Security is enabled for when real Supabase Auth is wired in later.
-- For now, the anon key is used read-only from the client with an open
-- select policy so the scaffold's role switcher works without login.
alter table profiles enable row level security;

drop policy if exists "Profiles are readable by anyone" on profiles;
create policy "Profiles are readable by anyone"
  on profiles for select
  using (true);

-- Seed profiles. IDs are fixed so they match the fallback profiles baked
-- into lib/current-profile.tsx (used when Supabase env vars aren't set yet).
insert into profiles (id, name, role) values
  ('00000000-0000-0000-0000-000000000001', 'Jenny Mrema', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Amina Hassan', 'fellow'),
  ('00000000-0000-0000-0000-000000000003', 'David Mushi', 'fellow')
on conflict (id) do nothing;
