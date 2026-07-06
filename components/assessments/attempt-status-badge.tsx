import type { AssessmentAttempt } from "@/lib/types";

// Shared status badge used on the fellow assessments list, the class
// reader's Assessments section, and (inverted, for admins) the grading
// queue: Not started / Submitted — pending review / a numeric score.
export function AttemptStatusBadge({
  attempt,
}: {
  attempt: AssessmentAttempt | null;
}) {
  if (!attempt) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Not started
      </span>
    );
  }

  if (attempt.status === "submitted") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        Submitted — pending review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      {attempt.scoreEarned} / {attempt.scorePossible}
    </span>
  );
}
