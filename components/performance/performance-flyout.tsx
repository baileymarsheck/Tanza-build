"use client";

import Link from "next/link";
import { useCurrentProfile } from "@/lib/current-profile";

// Content for the "Performance" nav flyout: the Performance page itself,
// plus (admin only) Fellow Cohort, tucked in here rather than taking its
// own sidebar slot since it's a sub-view of performance tracking.
export function PerformanceFlyout({ onNavigate }: { onNavigate: () => void }) {
  const { profile } = useCurrentProfile();

  return (
    <div className="px-6 py-5">
      <ul className="space-y-0.5">
        <li>
          <Link
            href="/performance"
            onClick={onNavigate}
            className="-mx-2 block rounded-md px-2 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-navy"
          >
            Overview
          </Link>
        </li>
        {profile.role === "admin" && (
          <li>
            <Link
              href="/performance/cohort"
              onClick={onNavigate}
              className="-mx-2 block rounded-md px-2 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-navy"
            >
              Fellow Cohort
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
