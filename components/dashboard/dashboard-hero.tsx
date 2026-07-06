export function DashboardHero({
  greeting,
  subtitle,
  children,
}: {
  greeting: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-navy to-brand-navy-light p-6 text-white md:p-8">
      <h2 className="text-2xl font-semibold">{greeting}</h2>
      <p className="mt-1 text-white/70">{subtitle}</p>

      <div className="mt-6 grid grid-cols-3 gap-4">{children}</div>
    </div>
  );
}
