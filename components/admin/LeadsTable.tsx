import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Audit, Business, Lead } from "@/lib/types";

const STATUS_LABELS: Record<Audit["status"], string> = {
  pending: "ממתין",
  processing: "בעיבוד",
  completed: "הושלם",
  failed: "נכשל",
};

export function LeadsTable({
  items,
}: {
  items: { lead: Lead; business: Business | null; audit: Audit | null }[];
}) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-muted">לא נמצאו לידים בטווח שנבחר.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-border text-right text-xs text-ink-muted">
            <th className="pb-2 pl-3 font-medium">תאריך</th>
            <th className="pb-2 px-2 font-medium">שם</th>
            <th className="pb-2 px-2 font-medium">אימייל</th>
            <th className="pb-2 px-2 font-medium">עסק</th>
            <th className="pb-2 px-2 font-medium">אתר</th>
            <th className="pb-2 px-2 font-medium">ציון נראות</th>
            <th className="pb-2 px-2 font-medium">סטטוס</th>
            <th className="pb-2 pr-3 font-medium">דוח</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ lead, business, audit }) => (
            <tr key={lead.id} className="border-b border-border last:border-0">
              <td className="py-2.5 pl-3 whitespace-nowrap text-ink-muted">
                {new Date(lead.created_at).toLocaleDateString("he-IL")}
              </td>
              <td className="py-2.5 px-2 text-ink">{lead.full_name}</td>
              <td className="py-2.5 px-2 text-ink-muted" dir="ltr">
                {lead.email}
              </td>
              <td className="py-2.5 px-2 text-ink">{business?.business_name || "-"}</td>
              <td className="py-2.5 px-2 text-ink-muted" dir="ltr">
                {business?.website_url || "-"}
              </td>
              <td className="py-2.5 px-2 text-ink">
                {audit?.overall_visibility_score !== null && audit?.overall_visibility_score !== undefined
                  ? `${audit.overall_visibility_score}/100`
                  : "-"}
              </td>
              <td className="py-2.5 px-2">
                {audit ? (
                  <Badge tone={audit.status === "completed" ? "success" : "neutral"}>
                    {STATUS_LABELS[audit.status]}
                  </Badge>
                ) : (
                  "-"
                )}
              </td>
              <td className="py-2.5 pr-3">
                {audit ? (
                  <Link href={`/admin/audits/${audit.id}`} className="font-medium text-primary hover:underline">
                    פתח דוח
                  </Link>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
