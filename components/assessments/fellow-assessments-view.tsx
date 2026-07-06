"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { useCurrentProfile } from "@/lib/current-profile";
import { formatReleaseDate, isReleased, isScheduledPending } from "@/lib/availability";
import { AttemptStatusBadge } from "@/components/assessments/attempt-status-badge";

// Cross-class assessments list for fellows, grouped by module — mirrors the
// grouped structure of the "My Classes" nav flyout. Only surfaces an
// assessment if its parent class is released AND the assessment itself is
// released or scheduled-pending (never tease something behind a locked class).
export function FellowAssessmentsView() {
  const { modules } = useCurriculum();
  const { getAssessmentsForClass, getAttempt } = useAssessments();
  const { profile } = useCurrentProfile();

  const groups = modules
    .map((module) => ({
      module,
      rows: module.classes
        .filter((klass) => isReleased(klass))
        .flatMap((klass) =>
          getAssessmentsForClass(klass.id)
            .filter((a) => isReleased(a) || isScheduledPending(a))
            .map((assessment) => ({ klass, assessment }))
        ),
    }))
    .filter((g) => g.rows.length > 0);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-brand-navy">Assessments</h2>
      <p className="mt-1 text-sm text-slate-600">
        Complete assessments as they&apos;re released for your classes.
      </p>

      {groups.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">
          No assessments are available yet.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map(({ module, rows }) => (
            <section
              key={module.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <header className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                <h3 className="font-semibold text-brand-navy">{module.title}</h3>
              </header>
              <ul className="divide-y divide-slate-100">
                {rows.map(({ klass, assessment }) => {
                  const scheduledPending = isScheduledPending(assessment);
                  if (scheduledPending) {
                    return (
                      <li
                        key={assessment.id}
                        className="flex items-center gap-3 px-5 py-3.5"
                      >
                        <CalendarClock size={16} className="shrink-0 text-amber-400" />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-400">
                            {assessment.title}
                          </span>
                          <p className="mt-0.5 truncate text-sm text-slate-400">
                            {klass.title}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-slate-400">
                          {assessment.releaseAt
                            ? `Unlocks ${formatReleaseDate(assessment.releaseAt)}`
                            : "Locked"}
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={assessment.id}>
                      <Link
                        href={`/assessments/${assessment.id}`}
                        className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-900">
                            {assessment.title}
                          </span>
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {klass.title}
                          </p>
                        </div>
                        <AttemptStatusBadge
                          attempt={getAttempt(assessment.id, profile.id)}
                        />
                        <ChevronRight size={18} className="shrink-0 text-slate-400" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
