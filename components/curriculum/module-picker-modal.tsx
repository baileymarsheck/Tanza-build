"use client";

import { useEffect, useRef } from "react";
import { useCurriculum } from "@/lib/curriculum";

// Small focused popout, step one of "Create Class": pick which module the
// new class belongs to. Selecting one closes this and hands off to the full
// class editor (see Sidebar, which owns both steps).
export function ModulePickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (moduleId: string) => void;
}) {
  const { modules } = useCurriculum();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a module"
        className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"
      >
        <h2 className="text-base font-semibold text-brand-navy">
          Create a class
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Which module should it belong to?
        </p>

        <ul className="mt-4 space-y-1.5">
          {modules.map((module) => (
            <li key={module.id}>
              <button
                type="button"
                onClick={() => onSelect(module.id)}
                className="block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:border-brand-orange hover:bg-orange-50/40"
              >
                {module.title}
              </button>
            </li>
          ))}
        </ul>

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
      </div>
    </div>
  );
}
