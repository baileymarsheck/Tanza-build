"use client";

import { useState } from "react";
import { useCurrentProfile } from "@/lib/current-profile";
import { useAssessments } from "@/lib/assessments";
import { useCurriculum } from "@/lib/curriculum";
import { formatReleaseDateTime } from "@/lib/availability";
import { GradingDetail } from "@/components/assessments/grading-detail";

export default function SubmissionsPage() {
  const { profile, allProfiles } = useCurrentProfile();
  const { getUngradedAttempts, getAssessment, questions } = useAssessments();
  const { getClass } = useCurriculum();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  if (profile.role !== "admin") {
    return (
      <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Submissions review is only available to Admins. Switch roles from the
        sidebar.
      </div>
    );
  }

  if (selectedAttemptId) {
    return (
      <GradingDetail
        attemptId={selectedAttemptId}
        onBack={() => setSelectedAttemptId(null)}
      />
    );
  }

  const ungraded = getUngradedAttempts();

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-brand-navy">Submissions Review</h2>
      <p className="mt-1 text-sm text-slate-600">
        Short-answer responses waiting for review.
      </p>

      {ungraded.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">
          No responses waiting for review.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {ungraded.map((attempt) => {
            const assessment = getAssessment(attempt.assessmentId);
            const found = getClass(attempt.classId);
            const fellow = allProfiles.find((p) => p.id === attempt.fellowId);
            const shortAnswerCount = attempt.answers.filter(
              (a) => questions.find((q) => q.id === a.questionId)?.type === "short-answer"
            ).length;
            const pending = attempt.answers.filter(
              (a) => a.pointsAwarded === null
            ).length;

            return (
              <li key={attempt.id}>
                <button
                  type="button"
                  onClick={() => setSelectedAttemptId(attempt.id)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {fellow?.name ?? "Fellow"}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {assessment?.title ?? "Assessment"} · {found?.klass.title ?? ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-400">
                      {formatReleaseDateTime(attempt.submittedAt)}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-amber-600">
                      {pending} of {shortAnswerCount} pending
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
