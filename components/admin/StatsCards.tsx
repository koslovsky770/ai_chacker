import { Card } from "@/components/ui/Card";

export function StatsCards({
  stats,
}: {
  stats: { total_leads: number; total_audits: number; completed_audits: number; total_checks: number };
}) {
  const items = [
    { label: "לידים שנאספו", value: stats.total_leads },
    { label: "בדיקות שבוצעו", value: stats.total_audits },
    { label: "בדיקות שהושלמו", value: stats.completed_audits },
    { label: "בדיקות AI שבוצעו בפועל", value: stats.total_checks },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-5">
          <p className="text-2xl font-extrabold text-ink">{item.value.toLocaleString("he-IL")}</p>
          <p className="mt-1 text-xs text-ink-muted">{item.label}</p>
        </Card>
      ))}
    </div>
  );
}
