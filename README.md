# Tanza Fellowship Hub

The fellow and admin workspace for the Tanza Fellowship. A role-aware
platform for managing curriculum, running assessments, reviewing
submissions, and tracking a fellow cohort's progress — backed by
Supabase, with a zero-setup localStorage fallback for demoing without a
backend.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Storage) for data and file uploads
- Deploys to Vercel

## Features

- **Home Dashboard** — role-aware snapshot: admins see cohort/curriculum
  pulse and an ungraded-submissions callout; fellows see what's still to
  do, what's pending review, their score so far, and recent feedback.
- **Curriculum** (admin) — modules containing classes, each with notes,
  a transcript, linked or uploaded resources/videos, and a
  locked/released/scheduled availability state. Classes can be created,
  edited, and deleted (with confirmation) from a "Create Class" flow.
- **My Classes** (fellow) — the released classes a fellow can access,
  grouped by module.
- **Assessments** — a shared, reusable question bank (multiple-choice
  and short-answer, tagged and weighted across Technical/Strategic/
  Leadership aptitudes) attached to classes via assessments a fellow
  takes. MCQ auto-grades on submit; short-answer waits for admin
  review. New assessments and new questions can be created inline
  without leaving the editor.
- **Submissions Review** (admin) — a grading queue for short-answer
  responses awaiting review.
- **Performance → Fellow Cohort** (admin) — a snapshot of every
  fellow's score so far and outstanding assessment count, drilling into
  a per-fellow page with every quiz result and a full question-by-
  question breakdown.
- **User Feedback** — a floating widget any role can use to report bugs
  or request changes, stored in Supabase.

Every domain area has a "Reset sample" action (Curriculum, Assessments)
to restore the seed data, useful after experimenting in a connected
Supabase project.

## How the role switcher works

There's no login yet. Instead, a `profiles` table (`id`, `name`,
`role: 'admin' | 'fellow'`) backs a "Viewing as" switcher in the sidebar.
If Supabase isn't connected, the app falls back to hardcoded sample
data (profiles, curriculum, questions/assessments) so the whole app is
demoable with zero setup. Once Supabase env vars are set and
`supabase/schema.sql` has been run, every provider reads/writes real
Supabase data instead — same shapes, so nothing else changes.

Real Supabase Auth (email/magic-link) can be added later without
changing this data model: it would add a `profiles.auth_user_id` column
linked to `auth.users`, and the switcher would be replaced by an actual
signed-in session.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local`.
3. (Optional, for real/shared data instead of the local-only fallback)
   Create a project at [supabase.com](https://supabase.com), copy the
   Project URL and anon key from *Project Settings > API* into
   `.env.local`, run `supabase/schema.sql` in the Supabase SQL editor,
   and create two public Storage buckets: `class-videos` and
   `class-resources` (each needs an `insert` Storage policy for
   uploads to work).
4. `npm run dev` and open http://localhost:3000.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   in the Vercel project's Environment Variables (`SUPABASE_SERVICE_ROLE_KEY`
   is reserved for future server-side use and isn't required yet).
4. Deploy. No build config changes are needed.

## Project structure

```
app/
  layout.tsx                     # root layout, wraps all providers
  page.tsx                       # redirects to /dashboard
  (app)/
    layout.tsx                    # sidebar + topbar + feedback widget shell
    dashboard/                     # role-aware landing page
    curriculum/                    # admin: modules/classes management
    classes/                       # fellow: released classes
      [classId]/                    # class detail (notes, resources, quizzes)
    assessments/                   # question bank + assessments (role-aware)
      [assessmentId]/                # take/view a specific assessment
      questions/                     # standalone question bank view
    performance/                   # placeholder overview
      cohort/                        # admin: fellow cohort snapshot
        [fellowId]/                    # admin: one fellow's full quiz history
    submissions/                   # admin: grading queue
    competencies/                  # admin-only placeholder
components/
  sidebar.tsx, nav-flyout.tsx, topbar.tsx, role-switcher.tsx,
  feedback-widget.tsx, modal.tsx, confirm-dialog.tsx, placeholder-page.tsx
  assessments/                    # question/assessment editors, grading, views
  curriculum/                     # class/module editors, flyouts
  dashboard/                      # hero + stat tiles
  performance/                    # cohort list + fellow detail views
lib/
  nav-config.ts                  # single source of truth for sidebar nav + roles
  current-profile.tsx             # "view as" context + Supabase fetch/fallback
  curriculum.tsx, assessments.tsx  # domain data providers (Supabase + fallback)
  feedback.ts, fellow-progress.ts, availability.ts, storage.ts
  supabase/client.ts, server.ts, storage.ts
supabase/
  schema.sql                     # full schema, RLS policies, seed profiles
```

### Adding a future feature area

Add one entry to `NAV_ITEMS` in `lib/nav-config.ts` (label, route, icon,
which roles see it) and create the matching route folder under `app/(app)/`.
The sidebar, topbar title, and role gating all pick it up automatically —
no other file needs to change.
