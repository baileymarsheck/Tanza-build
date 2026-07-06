"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCurrentProfile } from "@/lib/current-profile";
import { QuestionBankView } from "@/components/assessments/question-bank-view";

export default function QuestionBankPage() {
  const { profile } = useCurrentProfile();

  if (profile.role !== "admin") {
    return (
      <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        The question bank is only available to Admins. Switch roles from the
        sidebar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/assessments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy"
      >
        <ArrowLeft size={15} />
        Back to Assessments
      </Link>
      <QuestionBankView />
    </div>
  );
}
