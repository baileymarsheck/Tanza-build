export type Role = "admin" | "fellow";

export interface Profile {
  id: string;
  name: string;
  role: Role;
}

// --- Curriculum ---------------------------------------------------------

// How a class becomes available to fellows:
//  - "released": manually visible now
//  - "locked": manually hidden
//  - "scheduled": hidden until `releaseAt`, then automatically visible
// A manual toggle sets "released"/"locked" and clears any schedule, so a
// manual choice always overrides a scheduled date.
export type ClassStatus = "locked" | "released" | "scheduled";

export type ResourceKind =
  | "template"
  | "toolkit"
  | "reading"
  | "slides"
  | "link";

export interface ClassResource {
  id: string;
  label: string;
  url: string;
  kind: ResourceKind;
}

export interface ClassVideo {
  id: string;
  title: string;
  // Public URL of a file in the Supabase Storage 'class-videos' bucket, or
  // any directly-playable video URL when added manually.
  url: string;
}

export interface ClassRecord {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  status: ClassStatus;
  // ISO timestamp; only meaningful when status === "scheduled".
  releaseAt?: string | null;
  notes: string;
  transcript: string;
  resources: ClassResource[];
  // Optional so curriculum saved before videos existed (older localStorage,
  // seed rows) stays valid; treated as [] wherever it's read.
  videos?: ClassVideo[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
}

export interface ModuleWithClasses extends Module {
  classes: ClassRecord[];
}

// --- Assessments ---------------------------------------------------------

// Alias, not a new type: assessments reuse the exact locked/released/scheduled
// lifecycle classes already have (see lib/availability.ts). Kept as a distinct
// name so `AssessmentRecord.status: AvailabilityStatus` doesn't read like it's
// borrowing a "class" concept.
export type AvailabilityStatus = ClassStatus;

export type Aptitude = "technical" | "strategic" | "leadership";

// Percentage weights across the three fixed aptitudes, e.g. { technical: 70,
// strategic: 30 }. Partial + a missing key implies 0 weight.
export type AptitudeWeights = Partial<Record<Aptitude, number>>;

export type QuestionType = "multiple-choice" | "short-answer";

export interface QuestionOption {
  id: string;
  text: string;
  // Single-correct-answer model (radio, not checkbox).
  correct: boolean;
}

// A reusable bank entry — authored once, referenced by id from any number of
// assessments via AssessmentRecord.questionIds.
export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[]; // [] for short-answer
  points: number;
  aptitudeWeights: AptitudeWeights;
  tags: string[]; // free-text competency/behaviour tags
  createdAt: string;
}

// A class can have multiple assessments. Each references an ORDERED subset of
// the shared question bank by id, not by copy.
export interface AssessmentRecord {
  id: string;
  classId: string;
  title: string;
  description: string;
  status: AvailabilityStatus;
  releaseAt?: string | null;
  questionIds: string[];
  createdAt: string;
}

export interface QuestionAnswer {
  questionId: string;
  selectedOptionId?: string; // multiple-choice
  text?: string; // short-answer
}

export type AttemptStatus = "submitted" | "graded";
// "submitted": at least one short-answer answer is still awaiting manual
// grading. "graded": every answer (auto or manual) has a final score — this
// includes an all-MCQ attempt, which is "graded" immediately on submit.

export interface AttemptAnswerResult {
  questionId: string;
  answer: QuestionAnswer;
  isCorrect?: boolean; // multiple-choice only, computed at submit time
  pointsAwarded: number | null; // null until a short-answer is graded
  pointsPossible: number;
  feedback?: string; // admin's written feedback (short-answer only)
  gradedAt?: string | null;
}

// A fellow's one-and-only submission for a given assessment (MVP: no
// retakes — the take page always shows results once an attempt exists).
export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  classId: string; // denormalized for grading-queue grouping without a join
  fellowId: string; // Profile.id
  status: AttemptStatus;
  answers: AttemptAnswerResult[];
  scoreEarned: number;
  scorePossible: number;
  submittedAt: string;
  gradedAt?: string | null;
}
