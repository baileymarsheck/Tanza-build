"use client";

import { useState } from "react";
import { Pencil, Plus, RotateCcw } from "lucide-react";
import { useCurrentProfile } from "@/lib/current-profile";
import { useCurriculum } from "@/lib/curriculum";
import {
  defaultScheduleIso,
  formatReleaseDate,
  isReleased,
  isScheduledPending,
} from "@/lib/availability";
import type { ClassRecord } from "@/lib/types";
import { StatusPill } from "@/components/curriculum/status-pill";
import { ClassEditorModal } from "@/components/curriculum/class-editor-modal";
import { AvailabilityRow } from "@/components/availability-row";

export default function CurriculumPage() {
  const { profile } = useCurrentProfile();
  const { modules, addClass, addModule, resetToSample } = useCurriculum();
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
        {modules.map((module) => {
          // Not-yet-launched classes that have a scheduled go-live date.
          const upcoming = module.classes.flatMap((c) =>
            isScheduledPending(c) && c.releaseAt
              ? [`${c.title} launches ${formatReleaseDate(c.releaseAt)}`]
              : []
          );

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
                  {module.classes.filter((c) => isReleased(c)).length} /{" "}
                  {module.classes.length} released
                </span>
              </div>
              {module.description && (
                <p className="mt-0.5 text-sm text-slate-500">
                  {module.description}
                </p>
              )}
              {upcoming.length > 0 && (
                <p className="mt-1 text-sm italic text-slate-400">
                  {upcoming.join(" · ")}
                </p>
              )}
            </header>

            <ul className="divide-y divide-slate-100">
              {module.classes.map((klass) => (
                <AdminClassRow
                  key={klass.id}
                  klass={klass}
                  onEdit={() => setEditing(klass)}
                />
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
          );
        })}
      </div>

      <button
        type="button"
        onClick={addModule}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-brand-orange hover:text-brand-orange"
      >
        <Plus size={16} />
        Add module
      </button>

      <ClassEditorModal klass={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

// A class row in the admin manager: status, quick release toggle, and inline
// scheduling (set/clear a go-live date and edit it without opening the modal).
function AdminClassRow({
  klass,
  onEdit,
}: {
  klass: ClassRecord;
  onEdit: () => void;
}) {
  const { toggleClassStatus, updateClass } = useCurriculum();

  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-900">
              {klass.title}
            </span>
            <StatusPill item={klass} />
          </div>
          {klass.summary && (
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {klass.summary}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <Pencil size={14} />
          Edit
        </button>

        <AvailabilityRow
          status={klass.status}
          releaseAt={klass.releaseAt}
          itemLabel={klass.title}
          onSchedule={() =>
            updateClass(klass.id, {
              status: "scheduled",
              releaseAt: klass.releaseAt ?? defaultScheduleIso(),
            })
          }
          onUnschedule={() =>
            updateClass(klass.id, { status: "locked", releaseAt: null })
          }
          onChangeReleaseAt={(iso) => updateClass(klass.id, { releaseAt: iso })}
          onToggleRelease={() => toggleClassStatus(klass.id)}
        />
      </div>
    </li>
  );
}
