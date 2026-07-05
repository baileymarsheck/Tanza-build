"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_ITEMS } from "@/lib/nav-config";
import { useCurrentProfile } from "@/lib/current-profile";
import { RoleSwitcher } from "@/components/role-switcher";
import { NavFlyout } from "@/components/nav-flyout";

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useCurrentProfile();

  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [panelItemId, setPanelItemId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(profile.role)
  );
  const panelItem = NAV_ITEMS.find((item) => item.id === panelItemId) ?? null;

  const closePanel = () => setOpenItemId(null);

  const toggleFlyout = (itemId: string) => {
    if (openItemId === itemId) {
      setOpenItemId(null);
      return;
    }
    setPanelItemId(itemId);
    setOpenItemId(itemId);
  };

  // Auto-close when the route changes (e.g. the panel's own "Open" link was
  // followed) or when the active profile changes (a role switch may hide the
  // item the panel is describing) so the panel never sits open over content
  // the current view can't reach.
  useEffect(() => {
    setOpenItemId(null);
  }, [pathname, profile.id]);

  useEffect(() => {
    if (!openItemId) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closePanel();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openItemId]);

  return (
    <div ref={containerRef} className="flex h-full">
      <aside className="flex h-full w-64 shrink-0 flex-col bg-brand-navy text-white">
        <div className="border-b border-white/10 bg-white px-4 py-4">
          <Image
            src="/tanza-logo.png"
            alt="Tanza Partners"
            width={490}
            height={194}
            priority
            className="h-8 w-auto"
          />
        </div>
        <div className="border-b border-white/10 px-4 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-orange">
            Fellowship Hub
          </span>
        </div>

        <RoleSwitcher />

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleItems.map((item) => {
            const isActive =
              isNavItemActive(item, pathname) || openItemId === item.id;
            const Icon = item.icon;
            const sharedClasses = `flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? "bg-brand-orange/15 text-brand-orange"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`;

            if (item.hasFlyout) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleFlyout(item.id)}
                  aria-haspopup="dialog"
                  aria-expanded={openItemId === item.id}
                  className={sharedClasses}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            }

            return (
              <Link key={item.id} href={item.href} className={sharedClasses}>
                <Icon size={18} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <NavFlyout
        item={panelItem}
        isOpen={openItemId !== null}
        onClose={closePanel}
      />
    </div>
  );
}
