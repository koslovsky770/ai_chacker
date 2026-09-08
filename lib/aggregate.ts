// Aggregates competitors and sources across all ai_results rows of an audit,
// normalizing names/domains so the same entity isn't counted multiple times
// because of spelling differences.

import { normalizeText } from "./normalize";
import type { AiResult, ProviderName } from "./types";
import { activeProviders } from "./config";

export interface CompetitorRow {
  name: string;
  perProvider: Record<ProviderName, number>;
  total: number;
}

export interface SourceRow {
  domain: string;
  count: number;
  providers: ProviderName[];
}

export function aggregateCompetitors(results: AiResult[]): CompetitorRow[] {
  const map = new Map<string, CompetitorRow>();

  for (const result of results) {
    if (result.error_message || !result.checked_at) continue;
    for (const competitor of result.competitors || []) {
      const key = normalizeText(competitor.name).replace(/\s+/g, "");
      if (!key) continue;
      let row = map.get(key);
      if (!row) {
        row = {
          name: competitor.name,
          perProvider: Object.fromEntries(activeProviders().map((p) => [p, 0])) as Record<ProviderName, number>,
          total: 0,
        };
        map.set(key, row);
      }
      row.perProvider[result.provider] += 1;
      row.total += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function aggregateSources(results: AiResult[]): SourceRow[] {
  const map = new Map<string, SourceRow>();

  for (const result of results) {
    if (result.error_message || !result.checked_at) continue;
    for (const source of result.sources || []) {
      if (!source.domain) continue;
      let row = map.get(source.domain);
      if (!row) {
        row = { domain: source.domain, count: 0, providers: [] };
        map.set(source.domain, row);
      }
      row.count += 1;
      if (!row.providers.includes(result.provider)) row.providers.push(result.provider);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function businessOwnSiteUsedAsSource(results: AiResult[], domainRoot: string | null): boolean {
  if (!domainRoot) return false;
  return results.some(
    (r) => !r.error_message && r.checked_at && (r.sources || []).some((s) => s.domain.includes(domainRoot))
  );
}
