import { Card } from "@/components/ui/Card";
import { ProviderMark } from "@/components/ui/ProviderMark";
import { PROVIDERS, activeProviders } from "@/lib/config";
import type { AiResult, AuditQuery } from "@/lib/types";

const QUERY_TYPE_LABELS: Record<string, string> = {
  direct_service: "חיפוש ישיר לפי שירות",
  geographic: "חיפוש גיאוגרפי",
  problem_need: "חיפוש לפי צורך",
  specialization: "חיפוש לפי התמחות",
  high_intent: "כוונת רכישה גבוהה",
  comparative: "חיפוש השוואתי",
};

function ResultCell({ result }: { result: AiResult | undefined }) {
  if (!result || result.checked_at === null) {
    return <p className="text-xs text-ink-muted">ממתין לבדיקה</p>;
  }
  if (result.error_message) {
    return <p className="text-xs text-warning">אירעה שגיאה זמנית בבדיקה מול ספק זה</p>;
  }
  if (result.recommended) {
    return (
      <p className="text-xs text-success">
        ✅ העסק הופיע בהמלצות{result.position ? ` (מקום ${result.position})` : ""}
      </p>
    );
  }
  return <p className="text-xs text-ink-muted">✕ בבדיקה זו העסק לא הופיע בהמלצות</p>;
}

export function QueryBreakdown({ queries, results }: { queries: AuditQuery[]; results: AiResult[] }) {
  const providers = activeProviders();

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-lg font-bold text-ink">פירוט לפי שאילתה</h2>
      <p className="mb-5 text-sm text-ink-muted">כך נראית כל אחת מהשאילתות שנבדקו בפועל, מול כל מנוע.</p>
      <div className="flex flex-col divide-y divide-border">
        {queries.map((q) => {
          const queryResults = results.filter((r) => r.query_id === q.id);
          return (
            <div key={q.id} className="py-5 first:pt-0 last:pb-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs text-ink-muted">
                  {QUERY_TYPE_LABELS[q.query_type] || q.query_type}
                </span>
              </div>
              <p className="mb-4 font-medium text-ink">&quot;{q.query_text}&quot;</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {providers.map((provider) => {
                  const result = queryResults.find((r) => r.provider === provider);
                  return (
                    <div key={provider} className="flex items-start gap-2 rounded-xl bg-surface p-3">
                      <ProviderMark provider={provider} />
                      <div>
                        <p className="text-xs font-semibold text-ink">{PROVIDERS[provider].label}</p>
                        <ResultCell result={result} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
