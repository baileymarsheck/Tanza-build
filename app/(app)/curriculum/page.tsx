"use client";

import { useState } from "react";
import { Pencil, Plus, RotateCcw } from "lucide-react";
import { useCurrentProfile } from "@/lib/current-profile";
import { useCurriculum } from "@/lib/curriculum";
import type { ClassRecord } from "@/lib/types";
import { StatusPill } from "@/components/curriculum/status-pill";
import { ClassEditorDrawer } from "@/components/curriculum/class-editor-drawer";

export default function CurriculumPage() {
  const { profile } = useCurrentProfile();
  const { modules, toggleClassStatus, addClass, addModule, resetToSample } =
    useCurriculum();
  const [editing, setEditing] = useState<ClassRecord | null>(null);

  if (profile.role !== "admin") {
    return (
      <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Curriculum management is only available to Admins. Switch roles from the
        sidebar.
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-navy">Curriculum</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage modules and classes. Release a class to make it visible to
            fellows; lock it to hide it again.
          </p>
        </div>
        <button
          type="button"
          onClick={resetToSample}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          title="Restore the sample curriculum"
        >
          <RotateCcw size={15} />
          Reset sample
        </button>
      </div>

      <div className="space-y-5">
        {modules.map((module) => (
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
                  {module.classes.filter((c) => c.status === "released").length}{" "}
                  / {module.classes.length} released
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
                <li
                  key={klass.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-900">
                        {klass.title}
                      </span>
                      <StatusPill status={klass.status} />
                    </div>
                    {klass.summary && (
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {klass.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(klass)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <ReleaseToggle
                      released={klass.status === "released"}
                      onToggle={() => toggleClassStatus(klass.id)}
                    />
                  </div>
                </li>
              ))}

              <li className="px-5 py-2.5">
                <button
                  type="button"
                  onClick={() => addClass(module.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-navy hover:text-brand-orange"
                >
                  <Plus size={15} />
                  Add class
                </button>
              </li>
            </ul>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={addModule}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-brand-orange hover:text-brand-orange"
      >
        <Plus size={16} />
        Add module
      </button>

      <ClassEditorDrawer klass={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

// Accessible switch for releasing / locking a class.
function ReleaseToggle({
  released,
  onToggle,
}: {
  released: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={released}
      onClick={onToggle}
      title={released ? "Lock (hide from fellows)" : "Release to fellows"}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        released ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span className="sr-only">
        {released ? "Locked" : "Released"} — toggle
      </span>
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
          released ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
