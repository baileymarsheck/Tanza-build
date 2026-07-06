import { isReleased } from "@/lib/availability";
import type {
  AssessmentAttempt,
  AssessmentRecord,
  ClassRecord,
  ModuleWithClasses,
} from "@/lib/types";

export interface AvailableAssessment {
  klass: ClassRecord;
  assessment: AssessmentRecord;
}

// Every assessment a fellow could act on right now: parent class and the
// assessment itself must both be released. Same rule as the fellow's own
// dashboard "To do" computation — shared here so the cohort snapshot and a
// fellow's own view never disagree about what's "live".
export function getAvailableAssessments(
  modules: ModuleWithClasses[],
  getAssessmentsForClass: (classId: string) => AssessmentRecord[]
): AvailableAssessment[] {
  return modules.flatMap((module) =>
    module.classes
      .filter((klass) => isReleased(klass))
      .flatMap((klass) =>
        getAssessmentsForClass(klass.id)
          .filter((assessment) => isReleased(assessment))
          .map((assessment) => ({ klass, assessment }))
      )
  );
}

export interface FellowAssessmentItem extends AvailableAssessment {
  attempt: AssessmentAttempt | null;
}

export interface FellowProgress {
  items: FellowAssessmentItem[];
  scoreEarned: number;
  scorePossible: number;
  gradedCount: number;
  // Live assessments without a final grade yet — not started or still
  // pending review.
  uncompletedCount: number;
}

export function summarizeFellowProgress(
  fellowId: string,
  available: AvailableAssessment[],
  getAttempt: (assessmentId: string, fellowId: string) => AssessmentAttempt | null
): FellowProgress {
  const items: FellowAssessmentItem[] = available.map(({ klass, assessment }) => ({
    klass,
    assessment,
    attempt: getAttempt(assessment.id, fellowId),
  }));

  const graded = items.filter((item) => item.attempt?.status === "graded");
  const scoreEarned = graded.reduce(
    (sum, item) => sum + (item.attempt?.scoreEarned ?? 0),
    0
  );
  const scorePossible = graded.reduce(
    (sum, item) => sum + (item.attempt?.scorePossible ?? 0),
    0
  );

  return {
    items,
    scoreEarned,
    scorePossible,
    gradedCount: graded.length,
    uncompletedCount: items.length - graded.length,
  };
}
