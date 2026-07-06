"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { useCurrentProfile } from "@/lib/current-profile";
import { isReleased } from "@/lib/availability";
import { StatTile } from "@/components/dashboard/stat-tile";

export function AdminDashboard() {
  const { profile, allProfiles } = useCurrentProfile();
  const { modules } = useCurriculum();
  const { getAssessmentsForClass, getUngradedAttempts } = useAssessments();

  const fellowCount = allProfiles.filter((p) => p.role === "fellow").length;

  const allClasses = modules.flatMap((m) => m.classes);
  const releasedClasses = allClasses.filter((c) => isReleased(c)).length;

  const allAssessments = allClasses.flatMap((klass) => getAssessmentsForClass(klass.id));
  const releasedAssessments = allAssessments.filter((a) => isReleased(a)).length;

  const ungradedCount = getUngradedAttempts().length;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-brand-navy">
        Welcome, {profile.name.split(" ")[0]}
      </h2>
      <p className="mt-1 text-sm text-slate-600">Here's where things stand.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatTile label="Fellows" value={String(fellowCount)} />
        <StatTile
          label="Classes released"
          value={`${releasedClasses} / ${allClasses.length}`}
        />
        <StatTile
          label="Assessments released"
          value={`${releasedAssessments} / ${allAssessments.length}`}
        />
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        {ungradedCount === 0 ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
            <p className="text-sm text-slate-600">
              All caught up — nothing waiting for review.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-brand-navy">Needs attention</h3>
              <p className="mt-1 text-sm text-slate-600">
                {ungradedCount} submission{ungradedCount === 1 ? "" : "s"} waiting
                for review.
              </p>
            </div>
            <Link
              href="/submissions"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
            >
              Review now
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
