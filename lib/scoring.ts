// Transparent, explainable scoring. No hidden weighting - just
// recommended / total, per provider and overall.
//
// NOTE: if position-based weighting is wanted later, add it here behind a
// flag (e.g. WEIGHT_BY_POSITION) rather than changing the raw counts, so the
// "X out of Y" figures stay honest and the weighted score is clearly separate.

import type { AiResult, ProviderName } from "./types";
import { PROVIDERS, activeProviders } from "./config";

export interface ProviderScore {
  provider: ProviderName;
  label: string;
  recommended: number;
  total: number;
  percentage: number; // 0-100, rounded
}

export interface OverallScore {
  recommended: number;
  total: number;
  percentage: number; // 0-100, rounded, this is the "AI Visibility" headline number
  perProvider: ProviderScore[];
}

export function computeScores(results: AiResult[]): OverallScore {
  const successResults = results.filter((r) => r.error_message === null && r.checked_at !== null);

  const perProvider: ProviderScore[] = activeProviders().map((provider) => {
    const providerResults = successResults.filter((r) => r.provider === provider);
    const recommended = providerResults.filter((r) => r.recommended).length;
    const total = providerResults.length;
    return {
      provider,
      label: PROVIDERS[provider].label,
      recommended,
      total,
      percentage: total > 0 ? Math.round((recommended / total) * 100) : 0,
    };
  });

  const recommended = perProvider.reduce((sum, p) => sum + p.recommended, 0);
  const total = perProvider.reduce((sum, p) => sum + p.total, 0);

  return {
    recommended,
    total,
    percentage: total > 0 ? Math.round((recommended / total) * 100) : 0,
    perProvider,
  };
}
