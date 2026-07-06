"use client";

import Link from "next/link";
import { useCurrentProfile } from "@/lib/current-profile";

// Content for the "Assessments" nav flyout: the Assessments page itself, plus
// (admin only) Create Assessment and Submissions Review, tucked in here
// rather than taking their own sidebar slots since they're sub-tasks of
// managing assessments.
export function AssessmentsFlyout({
  onNavigate,
  onCreateAssessment,
}: {
  onNavigate: () => void;
  onCreateAssessment: () => void;
}) {
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
            <button
              type="button"
              onClick={onCreateAssessment}
              className="-mx-2 block w-[calc(100%+1rem)] rounded-md px-2 py-2 text-left text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-navy"
            >
              Create Assessment
            </button>
          </li>
        )}
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
