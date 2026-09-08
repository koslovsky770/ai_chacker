import { Card } from "@/components/ui/Card";
import { ProviderLabel } from "@/components/ui/ProviderMark";
import type { ProviderScore } from "@/lib/scoring";

export function ProviderScoreCards({ perProvider }: { perProvider: ProviderScore[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {perProvider.map((p) => (
        <Card key={p.provider} className="p-6">
          <ProviderLabel provider={p.provider} />
          <p className="mt-4 text-2xl font-extrabold text-ink">
            {p.recommended}/{p.total}
          </p>
          <p className="text-sm text-ink-muted">
            העסק הומלץ ב־{p.percentage}% מהחיפושים שנבדקו ב{p.label}
          </p>
        </Card>
      ))}
    </div>
  );
}
