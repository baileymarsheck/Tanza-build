"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import type { NavItem } from "@/lib/nav-config";
import { ClassesFlyout } from "@/components/curriculum/classes-flyout";
import { CurriculumFlyout } from "@/components/curriculum/curriculum-flyout";

export function NavFlyout({
  item,
  isOpen,
  onClose,
  onCreateClass,
}: {
  item: NavItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateClass: () => void;
}) {
  const Icon = item?.icon;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={item ? `${item.label} panel` : undefined}
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`fixed inset-y-0 left-64 z-40 flex w-96 flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-200 ease-out ${
        isOpen
          ? "translate-x-0 opacity-100"
          : "pointer-events-none -translate-x-3 opacity-0"
      }`}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 p-6">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={22} strokeWidth={1.75} className="text-brand-orange" />}
          <h2 className="text-2xl font-semibold text-brand-navy">
            {item?.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={18} />
        </button>
      </div>

      {/* Per-item flyout content. Most items show a short description + an
          "Open" link; specific items render a richer panel (this is where
          more custom flyouts would plug in). */}
      <div className="flex-1 overflow-y-auto border-t border-slate-200">
        {item?.id === "classes" ? (
          <ClassesFlyout onNavigate={onClose} />
        ) : item?.id === "curriculum" ? (
          <CurriculumFlyout onNavigate={onClose} onCreateClass={onCreateClass} />
        ) : (
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed text-slate-600">
              {item?.description}
            </p>

            {item && (
              <Link
                href={item.href}
                onClick={onClose}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-navy hover:text-brand-orange"
              >
                Open {item.label}
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
