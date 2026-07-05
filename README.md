# Tanza Fellowship Hub

The fellow and admin workspace for the Tanza Fellowship (Phase 1: Classroom
Learning beta). This is the foundational **app shell** step: role-aware
navigation and layout, with no Fellowship features (classes, assessments,
etc.) built yet. It's designed so those features can be added as new routes
and nav entries without restructuring the app.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres) for data, prepared for Supabase Auth later
- Deploys to Vercel

## How the role switcher works

There's no login yet. Instead, a `profiles` table (`id`, `name`,
`role: 'admin' | 'fellow'`) backs a "Viewing as" switcher in the sidebar.
If Supabase isn't connected, the app falls back to three hardcoded sample
profiles (one admin, two fellows) so the shell works with zero setup. Once
Supabase env vars are set and `supabase/schema.sql` has been run, the same
switcher reads real rows instead — the IDs match, so nothing else changes.

Real Supabase Auth (email/magic-link) can be added later without changing
this data model: it would add a `profiles.auth_user_id` column linked to
`auth.users`, and the switcher would be replaced by an actual signed-in
session.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local`.
3. (Optional, for real data) Create a project at [supabase.com](https://supabase.com),
   copy the Project URL and anon key from *Project Settings > API* into
   `.env.local`, then run `supabase/schema.sql` in the Supabase SQL editor.
4. `npm run dev` and open http://localhost:3000.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add the same `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   and `SUPABASE_SERVICE_ROLE_KEY` env vars in the Vercel project settings.
4. Deploy. No build config changes are needed.

## Project structure

```
app/
  layout.tsx              # root layout, wraps CurrentProfileProvider
  page.tsx                 # redirects to /dashboard
  (app)/
    layout.tsx              # sidebar + topbar shell
    dashboard/               # role-aware landing page
    curriculum/              # admin-only placeholder
    classes/                 # fellow-only placeholder
    assessments/             # shared placeholder
    performance/             # shared placeholder
    submissions/             # admin-only placeholder
    competencies/            # admin-only placeholder
components/
  sidebar.tsx, topbar.tsx, role-switcher.tsx, placeholder-page.tsx
lib/
  nav-config.ts             # single source of truth for sidebar nav + roles
  current-profile.tsx        # "view as" context + Supabase fetch/fallback
  supabase/client.ts, server.ts
supabase/
  schema.sql                # profiles table + seed rows
```

### Adding a future feature area

Add one entry to `NAV_ITEMS` in `lib/nav-config.ts` (label, route, icon,
which roles see it) and create the matching route folder under `app/(app)/`.
The sidebar, topbar title, and role gating all pick it up automatically —
no other file needs to change.
