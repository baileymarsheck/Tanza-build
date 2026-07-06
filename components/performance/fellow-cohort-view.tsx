"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCurrentProfile } from "@/lib/current-profile";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { getAvailableAssessments, summarizeFellowProgress } from "@/lib/fellow-progress";

// Admin-only snapshot: one compact row per fellow (built to hold up with a
// large cohort, not a full breakdown per fellow inline) — score so far,
// aptitude placeholders, and how many live assessments are still
// uncompleted. Click through to a fellow for the full quiz-by-quiz view.
export function FellowCohortView() {
  const { allProfiles } = useCurrentProfile();
  const { modules } = useCurriculum();
  const { getAssessmentsForClass, getAttempt } = useAssessments();

  const fellows = allProfiles.filter((p) => p.role === "fellow");
  const available = getAvailableAssessments(modules, getAssessmentsForClass);

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold text-brand-navy">Fellow Cohort</h2>
      <p className="mt-1 text-sm text-slate-600">
        A snapshot of each fellow's progress. Click a fellow to see every quiz
        and its score.
      </p>

      {fellows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">No fellows yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {fellows.map((fellow) => {
            const progress = summarizeFellowProgress(fellow.id, available, getAttempt);

            return (
              <li key={fellow.id}>
                <Link
                  href={`/performance/cohort/${fellow.id}`}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
                >
                  <span className="min-w-[140px] flex-1 font-medium text-slate-900">
                    {fellow.name}
                  </span>

                  <div className="flex flex-wrap items-center gap-5">
                    <SnapshotStat
                      label="Score so far"
                      value={
                        progress.gradedCount === 0
                          ? "—"
                          : `${progress.scoreEarned} / ${progress.scorePossible}`
                      }
                    />
                    <SnapshotStat label="Technical" value="N/A" />
                    <SnapshotStat label="Strategic" value="N/A" />
                    <SnapshotStat label="Leadership" value="N/A" />
                    <SnapshotStat
                      label="Assessments Uncompleted"
                      value={String(progress.uncompletedCount)}
                      width="w-[92px]"
                    />
                  </div>

                  <ChevronRight size={18} className="shrink-0 text-slate-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SnapshotStat({
  label,
  value,
  width = "w-[72px]",
}: {
  label: string;
  value: string;
  width?: string;
}) {
  return (
    <div className={`${width} shrink-0 text-center`}>
      <p className="text-sm font-semibold text-brand-navy">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}
