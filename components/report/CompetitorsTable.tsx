import { Card } from "@/components/ui/Card";
import { ProviderMark } from "@/components/ui/ProviderMark";
import { PROVIDERS, activeProviders } from "@/lib/config";
import type { CompetitorRow } from "@/lib/aggregate";
import type { Business } from "@/lib/types";

export function CompetitorsTable({
  competitors,
  business,
  businessTotal,
}: {
  competitors: CompetitorRow[];
  business: Business;
  businessTotal: number;
}) {
  const providers = activeProviders();
  const rows = competitors.slice(0, 10);

  if (rows.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="mb-1 text-lg font-bold text-ink">מי מופיע במקום שלך?</h2>
        <p className="text-sm text-ink-muted">
          בבדיקות שבוצעו לא זוהו שמות מתחרים חוזרים באופן מובהק בתשובות ה-AI.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-6">
      <h2 className="mb-1 text-lg font-bold text-ink">מי מופיע במקום שלך?</h2>
      <p className="mb-5 text-sm text-ink-muted">
        עסקים ששמם הופיע בהמלצות ה-AI לצד השאילתות שבדקנו עבורך (שמות זהים בכתיב שונה מנורמלים יחד).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border text-right text-xs text-ink-muted">
              <th className="pb-2 pl-3 font-medium">שם העסק</th>
              {providers.map((p) => (
                <th key={p} className="pb-2 px-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <ProviderMark provider={p} className="h-5 w-5 text-[10px]" />
                    {PROVIDERS[p].label}
                  </span>
                </th>
              ))}
              <th className="pb-2 pr-3 font-medium">סה&quot;כ הופעות</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-primary/5 font-semibold text-ink">
              <td className="py-2.5 pl-3">{business.business_name} (אתם)</td>
              {providers.map((p) => (
                <td key={p} className="py-2.5 px-2">
                  -
                </td>
              ))}
              <td className="py-2.5 pr-3">{businessTotal}</td>
            </tr>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <td className="py-2.5 pl-3 text-ink">{row.name}</td>
                {providers.map((p) => (
                  <td key={p} className="py-2.5 px-2 text-ink-muted">
                    {row.perProvider[p] ?? 0}
                  </td>
                ))}
                <td className="py-2.5 pr-3 font-medium text-ink">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
