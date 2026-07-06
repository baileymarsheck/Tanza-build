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
  -- 'locked' | 'released' | 'scheduled'. When 'scheduled', release_at holds
  -- the time the class becomes visible to fellows automatically.
  status text not null default 'locked'
    check (status in ('locked', 'released', 'scheduled')),
  release_at timestamptz,
  notes text not null default '',
  transcript text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists classes_module_id_idx on classes (module_id);

-- Each row is metadata pointing at a resource file. Uploaded resources
-- (PDFs, slides, templates, etc.) live in a Supabase Storage bucket named
-- "class-resources" (public, same one-time setup as "class-videos" above);
-- `url` holds the public URL returned by getPublicUrl (see
-- lib/supabase/storage.ts). A resource can also just be a link, with no
-- uploaded file behind it.
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

-- Writes: open for now (no real Supabase Auth yet, so no auth.uid() to
-- scope an admin check against) — tighten to an admin-only check once
-- Auth lands, same tradeoff as every other table below.
drop policy if exists "Modules are writable by anyone" on modules;
create policy "Modules are writable by anyone"
  on modules for insert with check (true);
drop policy if exists "Modules are updatable by anyone" on modules;
create policy "Modules are updatable by anyone"
  on modules for update using (true) with check (true);
drop policy if exists "Modules are deletable by anyone" on modules;
create policy "Modules are deletable by anyone"
  on modules for delete using (true);

drop policy if exists "Classes are writable by anyone" on classes;
create policy "Classes are writable by anyone"
  on classes for insert with check (true);
drop policy if exists "Classes are updatable by anyone" on classes;
create policy "Classes are updatable by anyone"
  on classes for update using (true) with check (true);
drop policy if exists "Classes are deletable by anyone" on classes;
create policy "Classes are deletable by anyone"
  on classes for delete using (true);

drop policy if exists "Class resources are writable by anyone" on class_resources;
create policy "Class resources are writable by anyone"
  on class_resources for insert with check (true);
drop policy if exists "Class resources are updatable by anyone" on class_resources;
create policy "Class resources are updatable by anyone"
  on class_resources for update using (true) with check (true);
drop policy if exists "Class resources are deletable by anyone" on class_resources;
create policy "Class resources are deletable by anyone"
  on class_resources for delete using (true);


-- --------------------------------------------------------------------------
-- Class videos
--
-- Each row is metadata pointing at a video. Uploaded recordings live in a
-- Supabase Storage bucket named "class-videos"; `url` holds the public URL
-- returned by getPublicUrl (see lib/supabase/storage.ts). A class can have
-- several videos (e.g. the class recording plus a guest-speaker recording).
--
-- Storage setup (one-time, in the Supabase dashboard):
--   1. Storage > New bucket > name "class-videos", mark it Public.
--   2. Public buckets already allow anonymous read of getPublicUrl links.
--      To let admins upload, add a Storage policy for INSERT (tighten to
--      admins once real Supabase Auth is wired in).

create table if not exists class_videos (
  id text primary key,
  class_id text not null references classes (id) on delete cascade,
  title text not null default '',
  url text not null,
  position int not null default 0
);
create index if not exists class_videos_class_id_idx on class_videos (class_id);

alter table class_videos enable row level security;

drop policy if exists "Class videos are readable by anyone" on class_videos;
create policy "Class videos are readable by anyone"
  on class_videos for select using (true);

drop policy if exists "Class videos are writable by anyone" on class_videos;
create policy "Class videos are writable by anyone"
  on class_videos for insert with check (true);
drop policy if exists "Class videos are updatable by anyone" on class_videos;
create policy "Class videos are updatable by anyone"
  on class_videos for update using (true) with check (true);
drop policy if exists "Class videos are deletable by anyone" on class_videos;
create policy "Class videos are deletable by anyone"
  on class_videos for delete using (true);


-- --------------------------------------------------------------------------
-- Assessments: a shared, reusable question bank (questions/question_options),
-- attached by reference to one or more assessments via assessment_questions,
-- where each assessment belongs to a single class (a class can have many).
-- Fellow submissions live in assessment_attempts/attempt_answers, FK'd to
-- profiles.id as the user identity per the note at the top of this file.
--
-- Until this is connected, the app runs on the seed in
-- lib/assessments-data.ts and persists admin edits + fellow attempts to
-- localStorage; these tables are where that data moves to make it durable
-- and shared across users (in particular, so an admin's Submissions Review
-- queue can see attempts from every fellow, not just the local browser).

create table if not exists questions (
  id text primary key,
  type text not null check (type in ('multiple-choice', 'short-answer')),
  prompt text not null,
  points int not null default 1,
  -- Percentage weighting across the three fixed aptitudes. Separate int
  -- columns (not jsonb) so a future Performance rollup can sum/aggregate
  -- directly in SQL without unpacking a blob per row.
  weight_technical int not null default 0,
  weight_strategic int not null default 0,
  weight_leadership int not null default 0,
  -- Free-text competency/behaviour tags, e.g. {'data-diagnosis'}.
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Options for multiple-choice questions. MVP is single-correct-answer: the
-- app enforces exactly one is_correct = true per question; not a DB
-- constraint since Postgres check constraints can't easily express
-- "exactly one row per group" without a trigger.
create table if not exists question_options (
  id text primary key,
  question_id text not null references questions (id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  position int not null default 0
);
create index if not exists question_options_question_id_idx
  on question_options (question_id);

create table if not exists assessments (
  id text primary key,
  class_id text not null references classes (id) on delete cascade,
  title text not null,
  description text not null default '',
  -- Same three-state lifecycle as classes.status — see that table's comment.
  status text not null default 'locked'
    check (status in ('locked', 'released', 'scheduled')),
  release_at timestamptz,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists assessments_class_id_idx on assessments (class_id);

-- Many-to-many: a question can be reused across multiple assessments/classes;
-- an assessment references an ordered subset of the shared bank.
create table if not exists assessment_questions (
  assessment_id text not null references assessments (id) on delete cascade,
  question_id text not null references questions (id) on delete cascade,
  position int not null default 0,
  primary key (assessment_id, question_id)
);
create index if not exists assessment_questions_question_id_idx
  on assessment_questions (question_id);

-- One attempt per fellow per assessment — MVP has no retakes, enforced here
-- with a unique index (the app also checks for an existing attempt before
-- rendering the take form).
create table if not exists assessment_attempts (
  id text primary key,
  assessment_id text not null references assessments (id) on delete cascade,
  class_id text not null references classes (id) on delete cascade,
  fellow_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted', 'graded')),
  score_earned numeric not null default 0,
  score_possible numeric not null default 0,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz
);
create unique index if not exists assessment_attempts_one_per_fellow_idx
  on assessment_attempts (assessment_id, fellow_id);
create index if not exists assessment_attempts_fellow_id_idx
  on assessment_attempts (fellow_id);

create table if not exists attempt_answers (
  id text primary key,
  attempt_id text not null references assessment_attempts (id) on delete cascade,
  question_id text not null references questions (id) on delete cascade,
  selected_option_id text references question_options (id),
  answer_text text,
  is_correct boolean,
  points_awarded numeric,
  points_possible numeric not null default 1,
  feedback text,
  graded_at timestamptz
);
create index if not exists attempt_answers_attempt_id_idx
  on attempt_answers (attempt_id);

alter table questions enable row level security;
alter table question_options enable row level security;
alter table assessments enable row level security;
alter table assessment_questions enable row level security;
alter table assessment_attempts enable row level security;
alter table attempt_answers enable row level security;

drop policy if exists "Questions are readable by anyone" on questions;
create policy "Questions are readable by anyone"
  on questions for select using (true);

drop policy if exists "Question options are readable by anyone" on question_options;
create policy "Question options are readable by anyone"
  on question_options for select using (true);

drop policy if exists "Assessments are readable by anyone" on assessments;
create policy "Assessments are readable by anyone"
  on assessments for select using (true);

drop policy if exists "Assessment questions are readable by anyone" on assessment_questions;
create policy "Assessment questions are readable by anyone"
  on assessment_questions for select using (true);

-- Writes: open for now, same no-Auth-yet tradeoff as the curriculum tables
-- above — tighten to an admin-only check once Supabase Auth lands.
drop policy if exists "Questions are writable by anyone" on questions;
create policy "Questions are writable by anyone"
  on questions for insert with check (true);
drop policy if exists "Questions are updatable by anyone" on questions;
create policy "Questions are updatable by anyone"
  on questions for update using (true) with check (true);
drop policy if exists "Questions are deletable by anyone" on questions;
create policy "Questions are deletable by anyone"
  on questions for delete using (true);

drop policy if exists "Question options are writable by anyone" on question_options;
create policy "Question options are writable by anyone"
  on question_options for insert with check (true);
drop policy if exists "Question options are updatable by anyone" on question_options;
create policy "Question options are updatable by anyone"
  on question_options for update using (true) with check (true);
drop policy if exists "Question options are deletable by anyone" on question_options;
create policy "Question options are deletable by anyone"
  on question_options for delete using (true);

drop policy if exists "Assessments are writable by anyone" on assessments;
create policy "Assessments are writable by anyone"
  on assessments for insert with check (true);
drop policy if exists "Assessments are updatable by anyone" on assessments;
create policy "Assessments are updatable by anyone"
  on assessments for update using (true) with check (true);
drop policy if exists "Assessments are deletable by anyone" on assessments;
create policy "Assessments are deletable by anyone"
  on assessments for delete using (true);

drop policy if exists "Assessment questions are writable by anyone" on assessment_questions;
create policy "Assessment questions are writable by anyone"
  on assessment_questions for insert with check (true);
drop policy if exists "Assessment questions are updatable by anyone" on assessment_questions;
create policy "Assessment questions are updatable by anyone"
  on assessment_questions for update using (true) with check (true);
drop policy if exists "Assessment questions are deletable by anyone" on assessment_questions;
create policy "Assessment questions are deletable by anyone"
  on assessment_questions for delete using (true);

-- NOTE: attempts/answers hold real fellow submission content, unlike the
-- open-read curriculum tables above. An open select policy matches this
-- file's existing scaffold-stage precedent (no real Supabase Auth is wired
-- in yet, so there's no auth.uid() to scope by), but this is the first table
-- in the schema where that's a real privacy gap worth prioritizing once
-- Supabase Auth lands — tighten to something like:
--   using (
--     fellow_id = auth.uid()
--     or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
--   )
drop policy if exists "Assessment attempts are readable by anyone" on assessment_attempts;
create policy "Assessment attempts are readable by anyone"
  on assessment_attempts for select using (true);

drop policy if exists "Attempt answers are readable by anyone" on attempt_answers;
create policy "Attempt answers are readable by anyone"
  on attempt_answers for select using (true);

-- Writes: open for now, same tradeoff as the select policy above (and the
-- rest of this file) — tighten once Supabase Auth lands, in particular
-- scoping insert to `fellow_id = auth.uid()` so a fellow can only submit
-- their own attempt.
drop policy if exists "Assessment attempts are writable by anyone" on assessment_attempts;
create policy "Assessment attempts are writable by anyone"
  on assessment_attempts for insert with check (true);
drop policy if exists "Assessment attempts are updatable by anyone" on assessment_attempts;
create policy "Assessment attempts are updatable by anyone"
  on assessment_attempts for update using (true) with check (true);
drop policy if exists "Assessment attempts are deletable by anyone" on assessment_attempts;
create policy "Assessment attempts are deletable by anyone"
  on assessment_attempts for delete using (true);

drop policy if exists "Attempt answers are writable by anyone" on attempt_answers;
create policy "Attempt answers are writable by anyone"
  on attempt_answers for insert with check (true);
drop policy if exists "Attempt answers are updatable by anyone" on attempt_answers;
create policy "Attempt answers are updatable by anyone"
  on attempt_answers for update using (true) with check (true);
drop policy if exists "Attempt answers are deletable by anyone" on attempt_answers;
create policy "Attempt answers are deletable by anyone"
  on attempt_answers for delete using (true);


-- --------------------------------------------------------------------------
-- Feedback: free-form bug reports / feature requests submitted from the
-- floating "User Feedback" widget, visible to any signed-in role.

create table if not exists feedback (
  id text primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  profile_name text not null,
  category text not null check (category in ('bug', 'feature', 'general')),
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_at_idx
  on feedback (created_at desc);

alter table feedback enable row level security;

-- No auth yet, so anyone using the anon key can submit and read feedback —
-- same scaffold-stage tradeoff noted above for assessment_attempts. Once
-- Supabase Auth lands, tighten select to admins only and insert to
-- `profile_id = auth.uid()`.
drop policy if exists "Feedback is insertable by anyone" on feedback;
create policy "Feedback is insertable by anyone"
  on feedback for insert with check (true);

drop policy if exists "Feedback is readable by anyone" on feedback;
create policy "Feedback is readable by anyone"
  on feedback for select using (true);
