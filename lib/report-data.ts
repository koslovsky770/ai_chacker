import { getAudit, getBusiness, listQueries, listResults } from "./db";
import { computeScores, type OverallScore } from "./scoring";
import { aggregateCompetitors, aggregateSources, businessOwnSiteUsedAsSource, type CompetitorRow, type SourceRow } from "./aggregate";
import { domainRoot } from "./normalize";
import type { Audit, AuditQuery, AiResult, Business } from "./types";

export interface ReportData {
  audit: Audit;
  business: Business;
  queries: AuditQuery[];
  results: AiResult[];
  scores: OverallScore;
  competitors: CompetitorRow[];
  sources: SourceRow[];
  ownSiteUsedAsSource: boolean;
}

export async function loadReportData(auditId: number): Promise<ReportData> {
  const audit = await getAudit(auditId);
  const business = await getBusiness(audit.business_id);
  const [queries, results] = await Promise.all([listQueries(auditId), listResults(auditId)]);

  const scores = computeScores(results);
  const competitors = aggregateCompetitors(results);
  const sources = aggregateSources(results);
  const ownSiteUsedAsSource = businessOwnSiteUsedAsSource(results, domainRoot(business.domain));

  return { audit, business, queries, results, scores, competitors, sources, ownSiteUsedAsSource };
}
