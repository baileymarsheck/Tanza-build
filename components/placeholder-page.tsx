"use client";

import { ShieldAlert } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-config";
import { useCurrentProfile } from "@/lib/current-profile";

export function PlaceholderPage({ navId }: { navId: string }) {
  const { profile } = useCurrentProfile();
  const item = NAV_ITEMS.find((n) => n.id === navId);

  if (!item) return null;

  const hasAccess = item.roles.includes(profile.role);

  if (!hasAccess) {
    return (
      <div className="flex max-w-lg items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={20} />
        <div>
          <p className="font-medium text-amber-900">
            Not available in this view
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {item.label} is only visible to{" "}
            {item.roles.map((r) => (r === "admin" ? "Admins" : "Fellows")).join(
              " and "
            )}
            . Switch roles from the sidebar to see it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-orange">
        Coming soon
      </p>
      <h2 className="mt-1 text-xl font-semibold text-brand-navy">
        {item.label}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {item.description}
      </p>
    </div>
  );
}
