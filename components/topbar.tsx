"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-config";
import { useCurrentProfile } from "@/lib/current-profile";

export function Topbar() {
  const pathname = usePathname();
  const { profile } = useCurrentProfile();

  const activeItem = NAV_ITEMS.find((item) => pathname.startsWith(item.href));

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">
        {activeItem?.label ?? "Tanza Fellowship Hub"}
      </h1>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{profile.name}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">
          {profile.role}
        </span>
      </div>
    </header>
  );
}
