"use client";

import { useParams } from "next/navigation";
import { useCurrentProfile } from "@/lib/current-profile";
import { FellowDetailView } from "@/components/performance/fellow-detail-view";

export default function FellowDetailPage() {
  const params = useParams<{ fellowId: string }>();
  const { profile } = useCurrentProfile();

  if (profile.role !== "admin") {
    return (
      <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Fellow Cohort is only available to Admins. Switch roles from the
        sidebar.
      </div>
    );
  }

  return <FellowDetailView fellowId={params.fellowId} />;
}
