"use client";

import { useEffect, useRef } from "react";
import { Modal } from "@/components/modal";

// Small controlled confirmation modal. Renders nothing when closed. Focuses
// Cancel on open (safe default for destructive actions) and closes on Escape
// or backdrop click.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  return (
    <Modal open={open} onClose={onCancel} ariaLabel={title}>
      <h2 className="text-base font-semibold text-brand-navy">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
            destructive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-brand-navy hover:bg-brand-navy-light"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
