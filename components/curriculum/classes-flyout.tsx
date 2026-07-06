"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { isReleased } from "@/lib/availability";

// Content for the "My Classes" nav flyout: lists the currently released
// classes (the ones a fellow can actually open), grouped by module. Locked
// classes are intentionally omitted here since they can't be entered yet.
export function ClassesFlyout({ onNavigate }: { onNavigate: () => void }) {
  const { modules } = useCurriculum();

  const releasedByModule = modules
    .map((module) => ({
      module,
      classes: module.classes.filter((c) => isReleased(c)),
    }))
    .filter((group) => group.classes.length > 0);

  return (
    <div className="px-6 py-5">
      <Link
        href="/classes"
        onClick={onNavigate}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-navy hover:text-brand-orange"
      >
        View all classes
        <ArrowRight size={14} />
      </Link>

      {releasedByModule.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No classes have been released yet. They&apos;ll appear here as Tanza
          makes them available.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {releasedByModule.map(({ module, classes }) => (
            <div key={module.id}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {module.title}
              </p>
              <ul className="mt-1">
                {classes.map((klass) => (
                  <li key={klass.id}>
                    <Link
                      href={`/classes/${klass.id}`}
                      onClick={onNavigate}
                      className="-mx-2 block rounded-md px-2 py-2 text-base text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-navy"
                    >
                      {klass.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
