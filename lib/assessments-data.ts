import type { AssessmentAttempt, AssessmentRecord, Question } from "@/lib/types";

// Bump this when the seed shape changes so stale localStorage is discarded.
export const ASSESSMENTS_STORAGE_KEY = "tanza:assessments:v1";

// Seed a small question bank and one released assessment on the already-
// released "Performance Diagnosis" class (mod-data), so the feature is
// demoable with zero admin setup — same precedent as the curriculum seed.
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
];

export const SEED_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: "as-performance-diagnosis-check",
    classId: "cls-performance-diagnosis",
    title: "Performance Diagnosis Check",
    description:
      "A short check on reading the data correctly and communicating it well.",
    status: "released",
    questionIds: [
      "q-diagnosis-driver",
      "q-diagnosis-metric",
      "q-diagnosis-explain",
    ],
    createdAt: "2026-01-05T09:15:00.000Z",
  },
];

export const SEED_ATTEMPTS: AssessmentAttempt[] = [];
