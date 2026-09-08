import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { DateFilterForm } from "@/components/admin/DateFilterForm";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { StatsCards } from "@/components/admin/StatsCards";
import { isAdminAuthenticated } from "@/lib/auth";
import { adminListLeads, adminStats } from "@/lib/db";

export const metadata = { title: "אזור ניהול | AI Visibility Checker" };
export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const { from, to } = await searchParams;
  const [stats, leads] = await Promise.all([
    adminStats(),
    adminListLeads({ from, to, limit: 100, offset: 0 }),
  ]);

  const exportParams = new URLSearchParams();
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  const exportUrl = `/api/admin/leads/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">אזור ניהול</h1>
        <LogoutButton />
      </div>

      <StatsCards stats={stats} />

      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-ink">לידים</h2>
          <div className="flex flex-wrap items-center gap-3">
            <DateFilterForm from={from} to={to} />
            <a
              href={exportUrl}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              ייצוא CSV
            </a>
          </div>
        </div>
        <LeadsTable items={leads.items} />
        <p className="mt-4 text-xs text-ink-muted">
          מוצגים עד 100 לידים אחרונים בטווח שנבחר (סה&quot;כ {leads.total}).
        </p>
      </Card>
    </div>
  );
}
