"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, ChevronRight } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useAssessments } from "@/lib/assessments";
import { useCurrentProfile } from "@/lib/current-profile";
import {
  formatReleaseDate,
  isReleased,
  isScheduledPending,
} from "@/lib/availability";
import { ResourceIcon } from "@/components/curriculum/resource-icon";
import { LockedPanel } from "@/components/locked-panel";
import { AttemptStatusBadge } from "@/components/assessments/attempt-status-badge";

export default function ClassReaderPage() {
  const params = useParams<{ classId: string }>();
  const { getClass } = useCurriculum();
  const { getAssessmentsForClass, getAttempt } = useAssessments();
  const { profile } = useCurrentProfile();

  const found = getClass(params.classId);

  const backLink = (
    <Link
      href="/classes"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy"
    >
      <ArrowLeft size={15} />
      Back to My Classes
    </Link>
  );

  if (!found) {
    return (
      <div className="max-w-2xl space-y-4">
        {backLink}
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          This class doesn&apos;t exist or has been removed.
        </div>
      </div>
    );
  }

  const { module, klass } = found;
  const videos = klass.videos ?? [];
  const assessments = getAssessmentsForClass(klass.id).filter(
    (a) => isReleased(a) || isScheduledPending(a)
  );

  // Guard direct-URL access to a class that hasn't been released.
  if (!isReleased(klass)) {
    return (
      <div className="max-w-2xl space-y-4">
        {backLink}
        <LockedPanel
          noun="class"
          name={klass.title}
          scheduledPending={isScheduledPending(klass)}
          releaseAt={klass.releaseAt}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {backLink}

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-orange">
          {module.title}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-brand-navy">
          {klass.title}
        </h2>
        {klass.summary && (
          <p className="mt-1.5 text-slate-600">{klass.summary}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Main content */}
        <div className="min-w-0 space-y-6">
          {klass.notes && (
            <Section title="Notes">
              {klass.notes.split("\n\n").map((para, i) => (
                <p key={i} className="mb-3 last:mb-0">
                  {para}
                </p>
              ))}
            </Section>
          )}

          <Section title="Recording">
            {videos.length === 0 ? (
              <p className="text-sm text-slate-400">
                No recording has been added for this class yet.
              </p>
            ) : (
              <div className="space-y-5">
                {videos.map((video) => (
                  <figure key={video.id}>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      controls
                      preload="metadata"
                      src={video.url}
                      className="aspect-video w-full rounded-lg bg-black"
                    />
                    {video.title && (
                      <figcaption className="mt-2 text-sm font-medium text-slate-600">
                        {video.title}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </Section>

          {klass.transcript && (
            <Section title="Transcript">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-600">
                {klass.transcript}
              </pre>
            </Section>
          )}

          <Section title="Assessments">
            {assessments.length === 0 ? (
              <p className="text-sm text-slate-400">
                No assessments for this class yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {assessments.map((a) => {
                  const scheduledPending = isScheduledPending(a);
                  if (scheduledPending) {
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5"
                      >
                        <CalendarClock size={16} className="shrink-0 text-amber-400" />
                        <span className="flex-1 text-sm font-medium text-slate-400">
                          {a.title}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-slate-400">
                          {a.releaseAt
                            ? `Unlocks ${formatReleaseDate(a.releaseAt)}`
                            : "Locked"}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/assessments/${a.id}`}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 transition-colors hover:border-brand-orange hover:bg-orange-50/40"
                      >
                        <span className="flex-1 text-sm font-medium text-slate-800">
                          {a.title}
                        </span>
                        <AttemptStatusBadge attempt={getAttempt(a.id, profile.id)} />
                        <ChevronRight size={16} className="shrink-0 text-slate-400" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        {/* Resources sidebar */}
        <aside className="lg:sticky lg:top-0 lg:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Resources
            </h3>
            {klass.resources.length === 0 ? (
              <p className="text-sm text-slate-400">
                No resources for this class yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {klass.resources.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:border-brand-orange hover:bg-orange-50/40"
                    >
                      <span className="mt-0.5 shrink-0 text-brand-orange">
                        <ResourceIcon kind={r.kind} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800">
                          {r.label}
                        </span>
                        <span className="block text-xs uppercase tracking-wide text-slate-400">
                          {r.kind}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}
