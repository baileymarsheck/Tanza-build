import type { AssessmentAttempt, AssessmentRecord, Question } from "@/lib/types";

// Bump this when the seed shape changes so stale localStorage is discarded.
export const ASSESSMENTS_STORAGE_KEY = "tanza:assessments:v2";

// A question bank spanning several modules, plus a handful of assessments in
// different states (released / locked / scheduled) so the feature is fully
// demoable with zero admin setup — same precedent as the curriculum seed.
// A couple of questions are deliberately reused across assessments (see
// q-franchise-purpose and q-diagnosis-driver below) to show the bank's
// reusability, not just its existence.
export const SEED_QUESTIONS: Question[] = [
  {
    id: "q-diagnosis-driver",
    type: "multiple-choice",
    prompt:
      "A school's Term 2 assessment shows flat overall attendance but a sharp drop in reading scores for Grade 3 only. What's the most useful next step?",
    options: [
      {
        id: "q-diagnosis-driver-a",
        text: "Re-run the same assessment school-wide to confirm the numbers",
        correct: false,
      },
      {
        id: "q-diagnosis-driver-b",
        text: "Look at Grade 3-specific drivers first — teacher changes, materials, timetable — before assuming a school-wide cause",
        correct: true,
      },
      {
        id: "q-diagnosis-driver-c",
        text: "Escalate immediately to Tanza Leadership as a program-wide risk",
        correct: false,
      },
    ],
    points: 1,
    aptitudeWeights: { technical: 70, strategic: 30 },
    tags: ["data-diagnosis"],
    createdAt: "2026-01-05T09:00:00.000Z",
  },
  {
    id: "q-diagnosis-metric",
    type: "multiple-choice",
    prompt:
      "Which single metric best tells you whether children are actually learning to read, as opposed to just attending class?",
    options: [
      {
        id: "q-diagnosis-metric-a",
        text: "Attendance rate",
        correct: false,
      },
      {
        id: "q-diagnosis-metric-b",
        text: "Oral reading fluency (words correct per minute) on a leveled passage",
        correct: true,
      },
      {
        id: "q-diagnosis-metric-c",
        text: "Number of lessons delivered on schedule",
        correct: false,
      },
    ],
    points: 1,
    aptitudeWeights: { technical: 100 },
    tags: ["data-diagnosis", "program-1"],
    createdAt: "2026-01-05T09:05:00.000Z",
  },
  {
    id: "q-diagnosis-explain",
    type: "short-answer",
    prompt:
      "In 2-3 sentences, explain how you would communicate a mid-term drop in reading scores to a headteacher who is proud of their school's attendance numbers.",
    options: [],
    points: 3,
    aptitudeWeights: { strategic: 50, leadership: 50 },
    tags: ["stakeholder-communication"],
    createdAt: "2026-01-05T09:10:00.000Z",
  },
  {
    id: "q-outcomes-vs-activities",
    type: "multiple-choice",
    prompt:
      "Why does Tanza start each program with outcomes rather than a list of activities?",
    options: [
      {
        id: "q-outcomes-vs-activities-a",
        text: "A full timetable of lessons delivered on schedule means nothing if a child still can't read a sentence",
        correct: true,
      },
      {
        id: "q-outcomes-vs-activities-b",
        text: "Outcomes are easier to report to donors than activity counts",
        correct: false,
      },
      {
        id: "q-outcomes-vs-activities-c",
        text: "Activities can only be measured once a term",
        correct: false,
      },
    ],
    points: 1,
    aptitudeWeights: { strategic: 60, technical: 40 },
    tags: ["program-1", "theory-of-change"],
    createdAt: "2026-01-06T09:00:00.000Z",
  },
  {
    id: "q-franchise-purpose",
    type: "multiple-choice",
    prompt: "What is the core purpose of the franchise model?",
    options: [
      {
        id: "q-franchise-purpose-a",
        text: "To hold quality and experience consistent across thousands of schools without being in every classroom",
        correct: true,
      },
      {
        id: "q-franchise-purpose-b",
        text: "To centralize all decisions with Tanza Leadership",
        correct: false,
      },
      {
        id: "q-franchise-purpose-c",
        text: "To reduce the number of programs a school can run at once",
        correct: false,
      },
    ],
    points: 1,
    aptitudeWeights: { strategic: 70, leadership: 30 },
    tags: ["franchise-model"],
    createdAt: "2026-01-06T09:05:00.000Z",
  },
  {
    id: "q-franchise-risk",
    type: "short-answer",
    prompt:
      "Describe one risk of treating Program 1 and Program 2 as two separate projects rather than one coherent relationship with a school.",
    options: [],
    points: 3,
    aptitudeWeights: { strategic: 60, leadership: 40 },
    tags: ["franchise-model", "stakeholder-communication"],
    createdAt: "2026-01-06T09:10:00.000Z",
  },
  {
    id: "q-team-missed-meetings",
    type: "multiple-choice",
    prompt:
      "A team member has missed the last three weekly data review meetings. What's the best first step?",
    options: [
      {
        id: "q-team-missed-meetings-a",
        text: "Have a direct 1:1 conversation to understand what's actually going on",
        correct: true,
      },
      {
        id: "q-team-missed-meetings-b",
        text: "Note it in their next performance review without raising it now",
        correct: false,
      },
      {
        id: "q-team-missed-meetings-c",
        text: "Reassign their responsibilities to someone else immediately",
        correct: false,
      },
    ],
    points: 1,
    aptitudeWeights: { leadership: 80, strategic: 20 },
    tags: ["team-management"],
    createdAt: "2026-01-07T09:00:00.000Z",
  },
  {
    id: "q-leadership-3cs-clarity",
    type: "multiple-choice",
    prompt: "Which of these best exemplifies \"Clarity\" in the 3Cs leadership model?",
    options: [
      {
        id: "q-leadership-3cs-clarity-a",
        text: "Every team member can state their own role, this week's priority, and how success will be measured",
        correct: true,
      },
      {
        id: "q-leadership-3cs-clarity-b",
        text: "The team meets every day regardless of need",
        correct: false,
      },
      {
        id: "q-leadership-3cs-clarity-c",
        text: "One person makes all decisions to avoid confusion",
        correct: false,
      },
    ],
    points: 1,
    aptitudeWeights: { leadership: 100 },
    tags: ["leadership-3cs"],
    createdAt: "2026-01-07T09:05:00.000Z",
  },
  {
    id: "q-operating-rhythm-first-meeting",
    type: "short-answer",
    prompt:
      "In 2-3 sentences, explain how you'd run your first weekly operating rhythm meeting with a new team.",
    options: [],
    points: 3,
    aptitudeWeights: { leadership: 70, strategic: 30 },
    tags: ["operating-rhythms", "team-management"],
    createdAt: "2026-01-07T09:10:00.000Z",
  },
  {
    id: "q-district-officer-first-meeting",
    type: "multiple-choice",
    prompt:
      "You're meeting a district education officer for the first time. What should you prioritize?",
    options: [
      {
        id: "q-district-officer-first-meeting-a",
        text: "Understanding their existing priorities and systems before proposing anything new",
        correct: true,
      },
      {
        id: "q-district-officer-first-meeting-b",
        text: "Presenting the full Tanza program catalogue in the first meeting",
        correct: false,
      },
      {
        id: "q-district-officer-first-meeting-c",
        text: "Asking for a signed commitment by the end of the meeting",
        correct: false,
      },
    ],
    points: 1,
    aptitudeWeights: { strategic: 60, leadership: 40 },
    tags: ["stakeholder-management", "government-engagement"],
    createdAt: "2026-01-08T09:00:00.000Z",
  },
  {
    id: "q-risk-mitigation-plan",
    type: "short-answer",
    prompt:
      "You've identified a data-collection risk for next term (e.g. unreliable attendance registers at one school). Outline your mitigation plan in 2-3 sentences.",
    options: [],
    points: 3,
    aptitudeWeights: { technical: 30, strategic: 70 },
    tags: ["risk-triage"],
    createdAt: "2026-01-08T09:05:00.000Z",
  },
];

export const SEED_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: "as-performance-diagnosis-check",
    classId: "cls-performance-diagnosis",
    title: "Performance Diagnosis Check",
    description:
      "A short check on reading the data correctly and communicating it well.",
    status: "released",
    questionIds: ["q-diagnosis-driver", "q-diagnosis-metric", "q-diagnosis-explain"],
    createdAt: "2026-01-05T09:15:00.000Z",
  },
  {
    id: "as-onboarding-fundamentals",
    classId: "cls-program-1-onboarding",
    title: "Onboarding Fundamentals Quiz",
    description: "Checking the basics of the program model and the franchise.",
    status: "released",
    questionIds: ["q-outcomes-vs-activities", "q-franchise-purpose"],
    createdAt: "2026-01-06T09:15:00.000Z",
  },
  {
    id: "as-franchise-model-check",
    classId: "cls-franchise-onboarding",
    title: "Franchise Model Check",
    description: "A deeper look at what makes the franchise model work.",
    status: "scheduled",
    // Reuses q-franchise-purpose from the assessment above — the same
    // question, attached to two different assessments on two different
    // classes.
    releaseAt: "2026-09-01T09:00:00.000Z",
    questionIds: ["q-franchise-purpose", "q-franchise-risk"],
    createdAt: "2026-01-06T09:20:00.000Z",
  },
  {
    id: "as-risk-triage-practice",
    classId: "cls-critical-paths-risks",
    title: "Risk Triage Practice",
    description: "Practice spotting and mitigating delivery risks early.",
    status: "locked",
    // Reuses q-diagnosis-driver from the very first assessment.
    questionIds: ["q-diagnosis-driver", "q-risk-mitigation-plan"],
    createdAt: "2026-01-08T09:10:00.000Z",
  },
];

export const SEED_ATTEMPTS: AssessmentAttempt[] = [];
