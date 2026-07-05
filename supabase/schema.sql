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


-- --------------------------------------------------------------------------
-- Curriculum: modules -> classes -> class_resources
--
-- Backs the Curriculum (admin) and My Classes (fellow) views. Until this is
-- connected, the app runs on the seed in lib/curriculum-data.ts and persists
-- admin edits to localStorage; these tables are where that data moves to make
-- edits durable and shared across users.
--
-- Text ids (not uuids) are used to match the human-readable seed ids so the
-- fallback data and the database line up 1:1.

create table if not exists modules (
  id text primary key,
  title text not null,
  description text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id text primary key,
  module_id text not null references modules (id) on delete cascade,
  title text not null,
  summary text not null default '',
  -- 'locked' | 'released'; kept as text so more states can be added later.
  status text not null default 'locked' check (status in ('locked', 'released')),
  notes text not null default '',
  transcript text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists classes_module_id_idx on classes (module_id);

create table if not exists class_resources (
  id text primary key,
  class_id text not null references classes (id) on delete cascade,
  label text not null,
  url text not null,
  kind text not null default 'link'
    check (kind in ('template', 'toolkit', 'reading', 'slides', 'link')),
  position int not null default 0
);
create index if not exists class_resources_class_id_idx
  on class_resources (class_id);

-- RLS: everyone can read; writes are reserved for admins. The admin check is
-- a placeholder join against profiles until real Supabase Auth is wired in
-- (at which point auth.uid() maps to a profile and this tightens up).
alter table modules enable row level security;
alter table classes enable row level security;
alter table class_resources enable row level security;

drop policy if exists "Curriculum is readable by anyone" on modules;
create policy "Curriculum is readable by anyone"
  on modules for select using (true);

drop policy if exists "Classes are readable by anyone" on classes;
create policy "Classes are readable by anyone"
  on classes for select using (true);

drop policy if exists "Class resources are readable by anyone" on class_resources;
create policy "Class resources are readable by anyone"
  on class_resources for select using (true);
