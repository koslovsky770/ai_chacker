// Drives an audit forward by one bounded "tick": process a small batch of
// still-pending provider checks, then report current progress. Designed to
// be called repeatedly by the client (see app/api/audits/[id]/process) so no
// single serverless invocation has to run the whole audit end to end -
// see README "Architecture" for why.

import { mapWithConcurrency } from "./concurrency";
import { AI_CONCURRENCY, PROCESS_BATCH_SIZE } from "./config";
import {
  getAudit,
  getBusiness,
  listPendingResults,
  listResults,
  updateAudit,
  updateResult,
} from "./db";
import { analyzeResponse } from "./analysis";
import { extractDomain } from "./normalize";
import { runProvider } from "./providers";
import { computeScores } from "./scoring";
import type { AuditStatus } from "./types";

export interface AuditProgress {
  status: AuditStatus;
  total: number;
  completed: number;
  recommended: number;
  percentage: number;
}

export async function processAuditTick(auditId: number): Promise<AuditProgress> {
  const audit = await getAudit(auditId);

  if (audit.status === "completed" || audit.status === "failed") {
    const results = await listResults(auditId);
    const scores = computeScores(results);
    return {
      status: audit.status,
      total: results.length,
      completed: results.filter((r) => r.checked_at !== null).length,
      recommended: scores.recommended,
      percentage: scores.percentage,
    };
  }

  const business = await getBusiness(audit.business_id);
  const websiteDomain = business.domain || extractDomain(business.website_url || "");

  const pending = await listPendingResults(auditId, PROCESS_BATCH_SIZE);

  if (pending.length > 0) {
    await mapWithConcurrency(pending, AI_CONCURRENCY, async (row) => {
      const outcome = await runProvider(
        row.provider,
        { query: row.query_text, language: row.language, location: row.location },
        business.business_name
      );

      if (!outcome.ok) {
        await updateResult(row.id, {
          error_message: outcome.error,
          checked_at: new Date().toISOString(),
        });
        return;
      }

      const analysis = analyzeResponse({
        rawText: outcome.rawText,
        sources: outcome.sources,
        businessName: business.business_name,
        websiteDomain,
      });

      await updateResult(row.id, {
        mentioned: analysis.mentioned,
        recommended: analysis.recommended,
        position: analysis.position,
        business_name_detected: analysis.business_name_detected,
        raw_response: outcome.rawText.slice(0, 20000),
        sources_json: JSON.stringify(outcome.sources),
        competitors_json: JSON.stringify(analysis.competitors),
        error_message: null,
        checked_at: new Date().toISOString(),
      });
    });
  }

  const results = await listResults(auditId);
  const completed = results.filter((r) => r.checked_at !== null).length;
  const total = results.length;
  const scores = computeScores(results);

  if (completed >= total && total > 0) {
    await updateAudit(auditId, {
      status: "completed",
      recommended_count: scores.recommended,
      overall_visibility_score: scores.percentage,
      completed_at: new Date().toISOString(),
    });
    return { status: "completed", total, completed, recommended: scores.recommended, percentage: scores.percentage };
  }

  return { status: "processing", total, completed, recommended: scores.recommended, percentage: scores.percentage };
}
