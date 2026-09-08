import { Card } from "@/components/ui/Card";
import { ProviderMark } from "@/components/ui/ProviderMark";
import type { SourceRow } from "@/lib/aggregate";

export function SourcesList({ sources }: { sources: SourceRow[] }) {
  const rows = sources.slice(0, 12);

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-lg font-bold text-ink">על אילו מקורות ה-AI מסתמך?</h2>
      <p className="mb-5 text-sm text-ink-muted">
        דומיינים שצוטטו כמקור בתשובות ה-AI בעת החיפוש באינטרנט.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">לא זוהו מקורות מצוטטים בבדיקות שבוצעו.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((source) => (
            <li key={source.domain} className="flex items-center justify-between gap-3 py-3">
              <span dir="ltr" className="truncate text-sm font-medium text-ink">
                {source.domain}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex -space-x-1">
                  {source.providers.map((p) => (
                    <ProviderMark key={p} provider={p} className="h-5 w-5 text-[10px] ring-2 ring-surface-raised" />
                  ))}
                </div>
                <span className="text-xs text-ink-muted">
                  הופיע {source.count} {source.count === 1 ? "פעם" : "פעמים"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
