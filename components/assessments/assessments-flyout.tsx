"use client";

import Link from "next/link";
import { useCurrentProfile } from "@/lib/current-profile";

// Content for the "Assessments" nav flyout: the Assessments page itself, plus
// (admin only) Submissions Review, tucked in here rather than taking its own
// sidebar slot since it's really a sub-task of managing assessments.
export function AssessmentsFlyout({ onNavigate }: { onNavigate: () => void }) {
  const { profile } = useCurrentProfile();

  return (
    <div className="px-6 py-5">
      <ul className="space-y-0.5">
        <li>
          <Link
            href="/assessments"
            onClick={onNavigate}
            className="-mx-2 block rounded-md px-2 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-navy"
          >
            Assessments
          </Link>
        </li>
        {profile.role === "admin" && (
          <li>
            <Link
              href="/submissions"
              onClick={onNavigate}
              className="-mx-2 block rounded-md px-2 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-navy"
            >
              Submission Review
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
