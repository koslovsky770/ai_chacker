import { Card } from "@/components/ui/Card";
import type { Audit, Business } from "@/lib/types";
import type { OverallScore } from "@/lib/scoring";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
}

export function ScoreHeader({
  business,
  audit,
  scores,
}: {
  business: Business;
  audit: Audit;
  scores: OverallScore;
}) {
  const dateLabel = formatDate(audit.completed_at || audit.started_at);

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-right">
        <div>
          <p className="text-sm font-medium text-ink-muted">מדד הנראות שלך ב-AI</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ink">{business.business_name}</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">
            העסק שלך הופיע ב־{scores.recommended} מתוך {scores.total} המלצות שנבדקו.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-8 border-primary/15">
            <span className="text-4xl font-extrabold text-primary">{scores.percentage}</span>
            <span className="text-xs text-ink-muted">מתוך 100</span>
          </div>
        </div>
      </div>
      {dateLabel && (
        <p className="mt-6 border-t border-border pt-4 text-xs text-ink-muted">
          הנתונים מבוססים על {scores.total} בדיקות שבוצעו בתאריך {dateLabel}. תוצאות במנועי AI עשויות
          להשתנות לאורך זמן.
        </p>
      )}
    </Card>
  );
}
