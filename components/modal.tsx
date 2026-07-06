"use client";

import { X } from "lucide-react";
import { useDismissable } from "@/lib/use-dismissable";

// Small centered dialog shell (confirm prompts, single-choice pickers) —
// unmounts entirely when closed, dismissed by Escape or a backdrop click.
export function Modal({
  open,
  onClose,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  useDismissable(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}

// Full-screen editor shell (class/assessment/question editors) — stays
// mounted and goes `inert` when closed so it can fade/scale out instead of
// disappearing abruptly, dismissed by Escape or a backdrop click.
export function EditorModal({
  isOpen,
  onClose,
  title,
  subtitle,
  ariaLabel,
  maxWidthClassName = "max-w-2xl",
  zIndexClassName = "z-50",
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  ariaLabel?: string;
  maxWidthClassName?: string;
  zIndexClassName?: string;
  children: React.ReactNode;
}) {
  useDismissable(isOpen, onClose);

  return (
    <div
      inert={!isOpen}
      className={`fixed inset-0 ${zIndexClassName} transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-slate-900/40"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? title}
          className={`flex h-full w-full ${maxWidthClassName} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform duration-200 ease-out ${
            isOpen ? "scale-100" : "scale-95"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close editor"
              className="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
