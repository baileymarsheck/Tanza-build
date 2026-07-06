"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  PlayCircle,
  Users,
} from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { useCurrentProfile } from "@/lib/current-profile";
import { isReleased } from "@/lib/availability";
import { getTimeOfDayGreeting } from "@/lib/greeting";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
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
      <DashboardHero
        greeting={`${getTimeOfDayGreeting()}, ${profile.name.split(" ")[0]}`}
        subtitle="Here's where things stand."
      >
        <StatTile label="Fellows" value={String(fellowCount)} icon={Users} />
        <StatTile
          label="Classes released"
          value={`${releasedClasses} / ${allClasses.length}`}
          icon={PlayCircle}
          progress={
            allClasses.length === 0
              ? 0
              : (releasedClasses / allClasses.length) * 100
          }
        />
        <StatTile
          label="Assessments released"
          value={`${releasedAssessments} / ${allAssessments.length}`}
          icon={ClipboardCheck}
          progress={
            allAssessments.length === 0
              ? 0
              : (releasedAssessments / allAssessments.length) * 100
          }
        />
      </DashboardHero>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {ungradedCount === 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600">
              All caught up — nothing waiting for review.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <AlertCircle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy">Needs attention</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {ungradedCount} submission{ungradedCount === 1 ? "" : "s"} waiting
                  for review.
                </p>
              </div>
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
