import type { ModuleWithClasses } from "@/lib/types";

// Bump this when the seed shape changes so stale localStorage is discarded.
export const CURRICULUM_STORAGE_KEY = "tanza:curriculum:v1";

// Seed curriculum mirroring the five Phase 1 modules from the Fellowship
// outline. Foundations is released so fellows have something to work through;
// later modules stay locked to demonstrate the release progression. Released
// classes carry real content; locked ones are lighter since fellows can't
// open them yet.
//
// This is the zero-setup fallback. Once Supabase is connected these same
// records live in the modules / classes / class_resources tables (see
// supabase/schema.sql) and admin edits persist there instead of localStorage.
export const SEED_CURRICULUM: ModuleWithClasses[] = [
  {
    id: "mod-foundations",
    title: "Foundations",
    description:
      "Onboarding into the programs, the franchise model, and how the Fellowship works.",
    classes: [
      {
        id: "cls-program-1-onboarding",
        moduleId: "mod-foundations",
        title: "Program 1 – Onboarding",
        summary: "Orientation to the Fellowship and the first program model.",
        status: "released",
        notes:
          "Welcome to the Tanza Fellowship. This first session sets expectations for the six-month journey and introduces the first program you'll help deliver.\n\nWe cover three things: (1) what foundational literacy outcomes we're accountable for, (2) how the classroom → shadowing → execution phases build on each other, and (3) the behaviours we expect from implementation leaders from day one.\n\nCome away able to describe the program's theory of change in your own words, and to name the single metric that tells us whether children are learning.",
        transcript:
          "[00:00] Facilitator: Karibu, everyone. Over the next six months you're going to go from understanding the model to leading it in the field...\n[02:14] The reason we start with outcomes and not activities is simple — a full timetable of lessons means nothing if a child still can't read a sentence...\n[07:41] Let's walk through the phases. Phase one, where we are now, is classroom learning...",
        resources: [
          {
            id: "res-onb1-handbook",
            label: "Fellowship Handbook 2025",
            url: "https://example.org/handbook.pdf",
            kind: "reading",
          },
          {
            id: "res-onb1-slides",
            label: "Session 1 Slides",
            url: "https://example.org/session-1-slides.pdf",
            kind: "slides",
          },
          {
            id: "res-onb1-toc",
            label: "Program 1 Theory of Change (1-pager)",
            url: "https://example.org/program-1-toc.pdf",
            kind: "template",
          },
        ],
      },
      {
        id: "cls-program-2-onboarding",
        moduleId: "mod-foundations",
        title: "Program 2 – Onboarding",
        summary: "The second program model and where it fits in the franchise.",
        status: "released",
        notes:
          "Program 2 extends the foundational literacy approach into numeracy routines. This session maps how the two programs share systems (assessment cadence, coaching rhythms) and where they differ.\n\nFocus on the hand-off points: a school running both programs needs one coherent weekly rhythm, not two competing ones.",
        transcript:
          "[00:00] Facilitator: Now that you've seen Program 1, Program 2 will feel familiar — same spine, different subject...\n[05:30] The mistake teams make is treating these as two projects. To a headteacher, it's one relationship...",
        resources: [
          {
            id: "res-onb2-compare",
            label: "Program 1 vs Program 2 Comparison",
            url: "https://example.org/program-comparison.pdf",
            kind: "reading",
          },
          {
            id: "res-onb2-rhythm",
            label: "Combined Weekly Rhythm Template",
            url: "https://example.org/weekly-rhythm.xlsx",
            kind: "template",
          },
        ],
      },
      {
        id: "cls-program-3-onboarding",
        moduleId: "mod-foundations",
        title: "Program 3 – Onboarding",
        summary: "The third program model and its delivery requirements.",
        status: "released",
        notes:
          "Program 3 is the most operationally demanding of the three. This session is about readiness: what has to be true at a school before Program 3 can start, and how you assess that honestly.",
        transcript:
          "[00:00] Facilitator: Program 3 rewards preparation and punishes shortcuts. Let's talk about the readiness checklist...",
        resources: [
          {
            id: "res-onb3-readiness",
            label: "Program 3 Readiness Checklist",
            url: "https://example.org/program-3-readiness.pdf",
            kind: "toolkit",
          },
        ],
      },
      {
        id: "cls-franchise-onboarding",
        moduleId: "mod-foundations",
        title: "Franchise – Onboarding",
        summary: "How the franchise model creates consistency at scale.",
        status: "released",
        notes:
          "The franchise is how we hold quality constant across thousands of schools without being in every classroom. This session introduces the standardized systems, the support structure, and the accountability that make a franchise work — and your role within it.",
        transcript:
          "[00:00] Facilitator: A franchise isn't a franchise because of a logo. It's a franchise because the experience is the same everywhere...",
        resources: [
          {
            id: "res-fr-model",
            label: "Franchise Model Overview",
            url: "https://example.org/franchise-overview.pdf",
            kind: "reading",
          },
          {
            id: "res-fr-standards",
            label: "Franchise Standards Toolkit",
            url: "https://example.org/franchise-standards.zip",
            kind: "toolkit",
          },
        ],
      },
    ],
  },
  {
    id: "mod-data",
    title: "Data",
    description:
      "Diagnosing performance, managing risk, and building data habits that stick.",
    classes: [
      {
        id: "cls-performance-diagnosis",
        moduleId: "mod-data",
        title: "Performance Diagnosis",
        summary: "Reading school data to find what's actually driving outcomes.",
        status: "released",
        notes:
          "Most schools are drowning in data and starving for insight. This session teaches a simple diagnostic: start from the outcome, work backwards to the two or three drivers you can actually move this term.\n\nYou'll practise on a real (anonymised) school dataset.",
        transcript:
          "[00:00] Facilitator: A dashboard is not a diagnosis. Let's start with the question we're actually trying to answer...",
        resources: [
          {
            id: "res-diag-worksheet",
            label: "Performance Diagnosis Worksheet",
            url: "https://example.org/diagnosis-worksheet.xlsx",
            kind: "template",
          },
        ],
      },
      {
        id: "cls-critical-paths-risks",
        moduleId: "mod-data",
        title: "Critical Paths & Risks",
        summary: "Sequencing the work and surfacing risks before they bite.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-data-habits-routines",
        moduleId: "mod-data",
        title: "Data Habits & Routines",
        summary: "Turning data review into a weekly team habit.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-learning-loops",
        moduleId: "mod-data",
        title: "Learning Loops",
        summary: "Closing the loop from insight to action to re-measurement.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
    ],
  },
  {
    id: "mod-team",
    title: "Team",
    description:
      "Building and leading high-performing delivery teams in the field.",
    classes: [
      {
        id: "cls-high-performing-teams",
        moduleId: "mod-team",
        title: "High-Performing Teams",
        summary: "What separates teams that deliver from teams that drift.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-leading-with-3cs",
        moduleId: "mod-team",
        title: "Leading with 3Cs",
        summary: "Clarity, consistency, and care as a leadership operating system.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-operating-rhythms",
        moduleId: "mod-team",
        title: "Operating Rhythms",
        summary: "The meetings and routines that keep a team aligned.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-implementation-fidelity",
        moduleId: "mod-team",
        title: "Implementation Fidelity",
        summary: "Holding the model constant while adapting to context.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
    ],
  },
  {
    id: "mod-gov",
    title: "Government Engagement",
    description:
      "Positioning within government systems and the path to institutionalization.",
    classes: [
      {
        id: "cls-systems-positioning",
        moduleId: "mod-gov",
        title: "Systems & Positioning",
        summary: "Understanding where you sit in the government system.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-budget-program-scaling",
        moduleId: "mod-gov",
        title: "Budget & Program Scaling",
        summary: "Funding and scaling programs through government channels.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-stakeholder-management",
        moduleId: "mod-gov",
        title: "Stakeholder Management",
        summary: "Mapping and managing the people who make or break delivery.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-path-institutionalization",
        moduleId: "mod-gov",
        title: "Path to Institutionalization",
        summary: "Making the model outlast any single champion.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
    ],
  },
  {
    id: "mod-operations",
    title: "Operations",
    description:
      "The back-office systems that keep delivery running: finance, HR, supply chain, and IT.",
    classes: [
      {
        id: "cls-finance-compliance",
        moduleId: "mod-operations",
        title: "Finance & Compliance",
        summary: "Financial controls and staying compliant at scale.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-hr-admin-legal",
        moduleId: "mod-operations",
        title: "HR, Admin & Legal",
        summary: "People, paperwork, and the legal basics of running operations.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-supply-chain",
        moduleId: "mod-operations",
        title: "Supply Chain Management",
        summary: "Getting the right materials to the right schools on time.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
      {
        id: "cls-it-data-security",
        moduleId: "mod-operations",
        title: "IT & Data Security",
        summary: "Protecting the systems and data the franchise depends on.",
        status: "locked",
        notes: "",
        transcript: "",
        resources: [],
      },
    ],
  },
];
