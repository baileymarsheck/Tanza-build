"use client";

import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import type { ClassRecord } from "@/lib/types";

export default function ClassesPage() {
  const { modules } = useCurriculum();

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-brand-navy">My Classes</h2>
      <p className="mt-1 text-sm text-slate-600">
        Work through each module. Locked classes open as they&apos;re released
        by Tanza.
      </p>

      <div className="mt-6 space-y-5">
        {modules.map((module) => {
          const releasedCount = module.classes.filter(
            (c) => c.status === "released"
          ).length;
          return (
            <section
              key={module.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <header className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-brand-navy">
                    {module.title}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {releasedCount} of {module.classes.length} available
                  </span>
                </div>
                {module.description && (
                  <p className="mt-0.5 text-sm text-slate-500">
                    {module.description}
                  </p>
                )}
              </header>

              <ul className="divide-y divide-slate-100">
                {module.classes.map((klass) => (
                  <ClassRow key={klass.id} klass={klass} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ClassRow({ klass }: { klass: ClassRecord }) {
  if (klass.status === "locked") {
    return (
      <li className="flex items-center gap-3 px-5 py-3.5">
        <Lock size={16} className="shrink-0 text-slate-300" />
        <div className="min-w-0 flex-1">
          <span className="font-medium text-slate-400">{klass.title}</span>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-400">
          Locked
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={`/classes/${klass.id}`}
        className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <span className="font-medium text-slate-900">{klass.title}</span>
          {klass.summary && (
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {klass.summary}
            </p>
          )}
        </div>
        <ChevronRight size={18} className="shrink-0 text-slate-400" />
      </Link>
    </li>
  );
}
