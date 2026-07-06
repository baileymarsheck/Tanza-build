"use client";

import { useCurrentProfile } from "@/lib/current-profile";
import { FellowDashboard } from "@/components/dashboard/fellow-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default function DashboardPage() {
  const { profile } = useCurrentProfile();
  return profile.role === "admin" ? <AdminDashboard /> : <FellowDashboard />;
}
