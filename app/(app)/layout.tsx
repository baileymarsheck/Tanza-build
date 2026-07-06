import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { FeedbackWidget } from "@/components/feedback-widget";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
      <FeedbackWidget />
    </div>
  );
}
