"use client";

import { useState } from "react";
import { CalendarClock, Pencil, Plus, RotateCcw } from "lucide-react";
import { useCurrentProfile } from "@/lib/current-profile";
import { useCurriculum } from "@/lib/curriculum";
import {
  datetimeLocalToIso,
  defaultScheduleIso,
  formatReleaseDate,
  formatReleaseDateTime,
  isClassReleased,
  isClassScheduledPending,
  isoToDatetimeLocal,
} from "@/lib/class-availability";
import type { ClassRecord } from "@/lib/types";
import { StatusPill } from "@/components/curriculum/status-pill";
import { ClassEditorModal } from "@/components/curriculum/class-editor-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
            isClassScheduledPending(c) && c.releaseAt
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
                  {module.classes.filter((c) => isClassReleased(c)).length} /{" "}
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
// scheduling (set/clear a go-live date and edit it without opening the drawer).
function AdminClassRow({
  klass,
  onEdit,
}: {
  klass: ClassRecord;
  onEdit: () => void;
}) {
  const { toggleClassStatus, updateClass } = useCurriculum();
  const released = isClassReleased(klass);
  const scheduledPending = isClassScheduledPending(klass);
  const [confirmUnrelease, setConfirmUnrelease] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  function startSchedule() {
    updateClass(klass.id, {
      status: "scheduled",
      releaseAt: klass.releaseAt ?? defaultScheduleIso(),
    });
  }

  function cancelSchedule() {
    updateClass(klass.id, { status: "locked", releaseAt: null });
  }

  // Releasing is one click; un-releasing a live class asks first, since it
  // pulls the class out from under fellows who may already be in it.
  function handleToggle() {
    if (released) {
      setConfirmUnrelease(true);
    } else {
      toggleClassStatus(klass.id);
    }
  }

  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-900">
              {klass.title}
            </span>
            <StatusPill klass={klass} />
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
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={scheduledPending ? cancelSchedule : startSchedule}
            disabled={released}
            aria-pressed={scheduledPending}
            title={
              released
                ? "Already released — unrelease it first to schedule"
                : scheduledPending
                  ? "Cancel scheduled release"
                  : "Schedule release"
            }
            className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
              released
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                : scheduledPending
                  ? "border-amber-300 bg-amber-50 text-amber-600"
                  : "border-slate-300 text-slate-500 hover:bg-slate-100"
            }`}
          >
            <CalendarClock size={15} />
          </button>
          <ReleaseToggle released={released} onToggle={handleToggle} />
        </div>
      </div>

      {scheduledPending && klass.releaseAt && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50/60 px-3 py-2 text-sm">
          <CalendarClock size={15} className="shrink-0 text-amber-600" />
          {editingDate ? (
            <input
              type="datetime-local"
              autoFocus
              value={isoToDatetimeLocal(klass.releaseAt)}
              onChange={(e) =>
                updateClass(klass.id, {
                  releaseAt: datetimeLocalToIso(e.target.value),
                })
              }
              onBlur={() => setEditingDate(false)}
              className="rounded-md border border-amber-200 bg-white px-2 py-1 text-sm text-slate-800 focus:border-brand-orange focus:outline-none"
            />
          ) : (
            <>
              <span className="font-medium text-amber-800">
                Releases {formatReleaseDateTime(klass.releaseAt)}
              </span>
              <button
                type="button"
                onClick={() => setEditingDate(true)}
                className="text-xs font-medium text-brand-navy hover:text-brand-orange"
              >
                Change
              </button>
            </>
          )}
          <button
            type="button"
            onClick={cancelSchedule}
            className="ml-auto text-xs font-medium text-amber-600 hover:text-amber-800"
          >
            Unschedule
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmUnrelease}
        title="Unrelease this class?"
        message={`"${klass.title}" is currently visible to fellows. Unreleasing it will hide it from them — including anyone already working through it.`}
        confirmLabel="Unrelease"
        destructive
        onConfirm={() => {
          toggleClassStatus(klass.id);
          setConfirmUnrelease(false);
        }}
        onCancel={() => setConfirmUnrelease(false)}
      />
    </li>
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
