"use client";

import { useCurrentProfile } from "@/lib/current-profile";
import { NAV_ITEMS } from "@/lib/nav-config";

export default function DashboardPage() {
  const { profile } = useCurrentProfile();

  const otherItems = NAV_ITEMS.filter(
    (item) => item.id !== "dashboard" && item.roles.includes(profile.role)
  );

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-slate-900">
        Welcome, {profile.name.split(" ")[0]}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {profile.role === "admin"
          ? "You're viewing the platform as a Tanza Leadership admin. Here's what you'll be able to manage."
          : "You're viewing the platform as a Fellow. Here's what will live in your workspace."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {otherItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-2 text-slate-900">
                <Icon size={18} strokeWidth={1.75} className="text-orange-500" />
                <span className="font-medium">{item.label}</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-600">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
