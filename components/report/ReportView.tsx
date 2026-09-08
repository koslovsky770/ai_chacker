import { Badge } from "@/components/ui/Badge";
import { CompetitorsTable } from "./CompetitorsTable";
import { CTASection } from "./CTASection";
import { ProviderScoreCards } from "./ProviderScoreCards";
import { QueryBreakdown } from "./QueryBreakdown";
import { ScoreHeader } from "./ScoreHeader";
import { SourcesList } from "./SourcesList";
import type { ReportData } from "@/lib/report-data";

export function ReportView({ data, showCta = true }: { data: ReportData; showCta?: boolean }) {
  const { audit, business, queries, results, scores, competitors, sources, ownSiteUsedAsSource } = data;

  if (audit.status !== "completed") {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-14 text-center">
        <p className="text-ink-muted">הבדיקה עדיין בעיבוד. רעננו את העמוד בעוד רגע.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <ScoreHeader business={business} audit={audit} scores={scores} />
      <ProviderScoreCards perProvider={scores.perProvider} />
      {ownSiteUsedAsSource && (
        <Badge tone="success" className="self-start">
          אתר העסק שלך שימש כמקור לפחות בבדיקה אחת
        </Badge>
      )}
      <QueryBreakdown queries={queries} results={results} />
      <CompetitorsTable competitors={competitors} business={business} businessTotal={scores.recommended} />
      <SourcesList sources={sources} />
      {showCta && <CTASection />}
    </div>
  );
}
