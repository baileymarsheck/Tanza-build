"use client";

import Link from "next/link";

// Content for the "Curriculum" nav flyout: two menu items — Overview (the
// full management page) and Create Class (hands off to a module-picker
// popout, then the class editor — both owned by Sidebar so they aren't
// affected by this flyout closing).
export function CurriculumFlyout({
  onNavigate,
  onCreateClass,
}: {
  onNavigate: () => void;
  onCreateClass: () => void;
}) {
  return (
    <div className="px-6 py-5">
      <ul className="space-y-0.5">
        <li>
          <Link
            href="/curriculum"
            onClick={onNavigate}
            className="-mx-2 block rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-navy"
          >
            Overview
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={onCreateClass}
            className="-mx-2 block w-[calc(100%+1rem)] rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-navy"
          >
            Create Class
          </button>
        </li>
      </ul>
    </div>
  );
}
