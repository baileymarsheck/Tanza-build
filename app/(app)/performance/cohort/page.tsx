"use client";

import { useCurrentProfile } from "@/lib/current-profile";
import { FellowCohortView } from "@/components/performance/fellow-cohort-view";

export default function FellowCohortPage() {
  const { profile } = useCurrentProfile();

  if (profile.role !== "admin") {
    return (
      <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Fellow Cohort is only available to Admins. Switch roles from the
        sidebar.
      </div>
    );
  }

  return <FellowCohortView />;
}
