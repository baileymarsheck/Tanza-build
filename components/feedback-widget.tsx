"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import { useCurrentProfile } from "@/lib/current-profile";
import { saveFeedback, type FeedbackCategory } from "@/lib/feedback";

// Floating, always-available way for either role to flag a bug or request a
// change to the platform itself — distinct from anything modeled in the
// fellowship domain data, so it lives outside the sidebar/flyout system as a
// small self-contained widget anchored to the corner of the app shell.
export function FeedbackWidget() {
  const { profile } = useCurrentProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function close() {
    setIsOpen(false);
    setSubmitted(false);
    setCategory("general");
    setMessage("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;

    saveFeedback({
      profileId: profile.id,
      profileName: profile.name,
      category,
      message: message.trim(),
    });
    setSubmitted(true);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-brand-navy">
              User Feedback
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close feedback form"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-brand-navy">
                Thanks for the feedback!
              </p>
              <p className="mt-1 text-sm text-slate-500">
                We&apos;ve got it and will take a look.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-4 text-sm font-medium text-brand-orange hover:underline"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
              <p className="text-sm leading-relaxed text-slate-600">
                Found something broken, or wish the platform did something
                differently? Let us know.
              </p>

              <div>
                <label
                  htmlFor="feedback-category"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400"
                >
                  Type
                </label>
                <select
                  id="feedback-category"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as FeedbackCategory)
                  }
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-orange focus:outline-none"
                >
                  <option value="general">General feedback</option>
                  <option value="feature">Feature request</option>
                  <option value="bug">Something&apos;s not working</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="feedback-message"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400"
                >
                  Details
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  rows={4}
                  placeholder="Tell us what's on your mind..."
                  className="w-full resize-none rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-orange focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!message.trim()}
                className="w-full rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send feedback
              </button>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full bg-brand-orange px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-brand-orange/90"
      >
        <MessageSquarePlus size={17} strokeWidth={1.75} />
        User Feedback
      </button>
    </div>
  );
}
