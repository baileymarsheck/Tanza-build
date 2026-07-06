"use client";

import { useCurrentProfile } from "@/lib/current-profile";
import { AdminAssessmentsView } from "@/components/assessments/admin-assessments-view";
import { FellowAssessmentsView } from "@/components/assessments/fellow-assessments-view";

export default function AssessmentsPage() {
  const { profile } = useCurrentProfile();
  return profile.role === "admin" ? (
    <AdminAssessmentsView />
  ) : (
    <FellowAssessmentsView />
  );
}
