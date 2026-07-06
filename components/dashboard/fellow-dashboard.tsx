"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { useCurrentProfile } from "@/lib/current-profile";
import { isReleased } from "@/lib/availability";
import { StatTile } from "@/components/dashboard/stat-tile";
import type { AssessmentAttempt, AssessmentRecord, ClassRecord } from "@/lib/types";

interface AvailableItem {
  klass: ClassRecord;
  assessment: AssessmentRecord;
  attempt: AssessmentAttempt | null;
}

const VISIBLE_TODO_LIMIT = 4;

export function FellowDashboard() {
  const { modules } = useCurriculum();
  const { getAssessmentsForClass, getAttempt } = useAssessments();
  const { profile } = useCurrentProfile();

  // Every assessment the fellow could act on right now: parent class and the
  // assessment itself must both be released (scheduled-pending isn't
  // actionable yet, so it's excluded here).
  const available: AvailableItem[] = modules.flatMap((module) =>
    module.classes
      .filter((klass) => isReleased(klass))
      .flatMap((klass) =>
        getAssessmentsForClass(klass.id)
          .filter((assessment) => isReleased(assessment))
          .map((assessment) => ({
            klass,
            assessment,
            attempt: getAttempt(assessment.id, profile.id),
          }))
      )
  );

  const notStarted = available.filter((item) => !item.attempt);
  const pendingReview = available.filter(
    (item) => item.attempt?.status === "submitted"
  );

  const gradedAttempts = available
    .map((item) => item.attempt)
    .filter((a): a is AssessmentAttempt => a?.status === "graded");
  const scoreEarned = gradedAttempts.reduce((sum, a) => sum + a.scoreEarned, 0);
  const scorePossible = gradedAttempts.reduce((sum, a) => sum + a.scorePossible, 0);

  // Most recent graded items that actually carry written feedback — a quiet
  // nudge to go read it, not shown at all if nothing's been graded yet.
  const recentFeedback = available
    .filter((item) => item.attempt?.status === "graded" && item.attempt.answers.some((a) => a.feedback))
    .sort(
      (a, b) =>
        new Date(b.attempt!.gradedAt ?? 0).getTime() -
        new Date(a.attempt!.gradedAt ?? 0).getTime()
    )
    .slice(0, 2);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-brand-navy">
        Welcome, {profile.name.split(" ")[0]}
      </h2>
      <p className="mt-1 text-sm text-slate-600">Here's where things stand.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatTile label="To do" value={String(notStarted.length)} />
        <StatTile label="Pending review" value={String(pendingReview.length)} />
        <StatTile
          label="Score so far"
          value={gradedAttempts.length === 0 ? "—" : `${scoreEarned} / ${scorePossible}`}
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <h3 className="font-semibold text-brand-navy">To do</h3>
        </header>
        {notStarted.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">
            You're all caught up — no new assessments right now.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notStarted.slice(0, VISIBLE_TODO_LIMIT).map(({ klass, assessment }) => (
              <li key={assessment.id}>
                <Link
                  href={`/assessments/${assessment.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900">
                      {assessment.title}
                    </span>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {klass.title}
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
            {notStarted.length > VISIBLE_TODO_LIMIT && (
              <li className="px-5 py-2.5">
                <Link
                  href="/assessments"
                  className="text-sm font-medium text-brand-navy hover:text-brand-orange"
                >
                  View all in Assessments →
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      {recentFeedback.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <h3 className="font-semibold text-brand-navy">Recent feedback</h3>
          </header>
          <ul className="divide-y divide-slate-100">
            {recentFeedback.map(({ assessment, attempt }) => {
              const feedback = attempt!.answers.find((a) => a.feedback)?.feedback;
              return (
                <li key={assessment.id}>
                  <Link
                    href={`/assessments/${assessment.id}`}
                    className="block px-5 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-900">
                        {assessment.title}
                      </span>
                      <span className="shrink-0 text-sm font-medium text-emerald-700">
                        {attempt!.scoreEarned} / {attempt!.scorePossible}
                      </span>
                    </div>
                    {feedback && (
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {feedback}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
