"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCurrentProfile } from "@/lib/current-profile";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { defaultScheduleIso, isReleased } from "@/lib/availability";
import type { ClassRecord } from "@/lib/types";
import { StatusPill } from "@/components/curriculum/status-pill";
import { ClassEditorModal } from "@/components/curriculum/class-editor-modal";
import { AvailabilityRow } from "@/components/availability-row";
import { ConfirmDialog } from "@/components/confirm-dialog";

// Supports the "Create class" nav flyout: it creates the class, then sends
// the admin here with ?edit={id} so the editor opens immediately. Clear the
// param right after so a refresh doesn't reopen it. Split out because
// useSearchParams() requires a Suspense boundary.
function EditParamHandler({ onFound }: { onFound: (klass: ClassRecord) => void }) {
  const { getClass } = useCurriculum();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    const found = getClass(editId);
    if (found) onFound(found.klass);
    router.replace("/curriculum");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export default function CurriculumPage() {
  const { profile } = useCurrentProfile();
  const { modules, addClass, deleteClass, addModule, resetToSample } =
    useCurriculum();
  const { getAssessmentsForClass, deleteAssessment } = useAssessments();
  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ClassRecord | null>(
    null
  );

  function handleConfirmDelete() {
    if (!deleteCandidate) return;
    getAssessmentsForClass(deleteCandidate.id).forEach((a) =>
      deleteAssessment(a.id)
    );
    deleteClass(deleteCandidate.id);
    if (editing?.id === deleteCandidate.id) setEditing(null);
    setDeleteCandidate(null);
  }

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
      <Suspense fallback={null}>
        <EditParamHandler onFound={setEditing} />
      </Suspense>
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
            </header>

            <ul className="divide-y divide-slate-100">
              {module.classes.map((klass) => (
                <AdminClassRow
                  key={klass.id}
                  klass={klass}
                  onEdit={() => setEditing(klass)}
                  onDelete={() => setDeleteCandidate(klass)}
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

      <ClassEditorModal
        klass={editing}
        onClose={() => setEditing(null)}
        onDelete={() => setDeleteCandidate(editing)}
      />

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={`Delete "${deleteCandidate?.title || "this class"}"?`}
        message="This removes the class, its resources and videos, and any assessments attached to it. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
}

// A class row in the admin manager: status, quick release toggle, and inline
// scheduling (set/clear a go-live date and edit it without opening the modal).
function AdminClassRow({
  klass,
  onEdit,
  onDelete,
}: {
  klass: ClassRecord;
  onEdit: () => void;
  onDelete: () => void;
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

        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${klass.title}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
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
