"use client";

import { useEffect, useRef } from "react";
import { useCurriculum } from "@/lib/curriculum";
import { Modal } from "@/components/modal";

// Small focused popout, step one of "Create Assessment": pick which class
// the new assessment belongs to, grouped by module. Selecting one closes
// this and hands off to the full assessment editor (see Sidebar, which
// owns both steps).
export function ClassPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (classId: string) => void;
}) {
  const { modules } = useCurriculum();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  const modulesWithClasses = modules.filter((m) => m.classes.length > 0);

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Choose a class">
      <h2 className="text-base font-semibold text-brand-navy">
        Create an assessment
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Which class should it belong to?
      </p>

      <div className="mt-4 max-h-80 space-y-4 overflow-y-auto">
        {modulesWithClasses.length === 0 ? (
          <p className="text-sm text-slate-400">
            Add a class first — assessments belong to a class.
          </p>
        ) : (
          modulesWithClasses.map((module) => (
            <div key={module.id}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {module.title}
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {module.classes.map((klass) => (
                  <li key={klass.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(klass.id)}
                      className="block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:border-brand-orange hover:bg-orange-50/40"
                    >
                      {klass.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          ref={cancelRef}
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
