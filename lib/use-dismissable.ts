"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

// Shared "close on Escape, and on an outside click when a containerRef is
// given" behavior — previously copy-pasted into every flyout/modal/popout in
// the app. Centralized here since it's the one piece of dismiss logic that a
// non-web UI (no `document`) would need to reimplement entirely.
export function useDismissable(
  isOpen: boolean,
  onDismiss: () => void,
  containerRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef?.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onDismiss();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }

    document.addEventListener("keydown", handleKeyDown);
    if (containerRef) {
      document.addEventListener("pointerdown", handlePointerDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (containerRef) {
        document.removeEventListener("pointerdown", handlePointerDown);
      }
    };
  }, [isOpen, onDismiss, containerRef]);
}
