"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_ITEMS } from "@/lib/nav-config";
import { useCurrentProfile } from "@/lib/current-profile";
import { RoleSwitcher } from "@/components/role-switcher";

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useCurrentProfile();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(profile.role)
  );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
        <span className="text-lg font-semibold tracking-tight">Tanza</span>
        <span className="text-sm text-slate-400">Fellowship Hub</span>
      </div>

      <RoleSwitcher />

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const isActive = isNavItemActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
