// Thin typed client for the separate cPanel PHP database API.
// Vercel never talks to MySQL directly - every read/write goes through this
// HTTPS layer, authenticated with a shared secret header. See /cpanel-api.

import type {
  Audit,
  AuditQuery,
  AiResult,
  Business,
  Lead,
  ProviderName,
  QueryType,
  Language,
} from "./types";

export class DbApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "DbApiError";
  }
}

function apiUrl(): string {
  const url = process.env.DATABASE_API_URL;
  if (!url) {
    throw new DbApiError("DATABASE_API_URL is not configured on the server");
  }
  return url;
}

function apiSecret(): string {
  const secret = process.env.DATABASE_API_SECRET;
  if (!secret) {
    throw new DbApiError("DATABASE_API_SECRET is not configured on the server");
  }
  return secret;
}

async function callDbApi<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const base = apiUrl();
  const url = `${base}${base.includes("?") ? "&" : "?"}action=${encodeURIComponent(action)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Secret": apiSecret(),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new DbApiError("Failed to reach the database API");
  }

  let json: { ok: boolean; data?: T; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new DbApiError(`Database API returned a non-JSON response (status ${res.status})`, res.status);
  }

  if (!res.ok || !json.ok) {
    throw new DbApiError(json.error || `Database API error (status ${res.status})`, res.status);
  }
  return json.data as T;
}

// ---- leads -----------------------------------------------------------

export function createLead(input: { full_name: string; email: string; marketing_consent: boolean }) {
  return callDbApi<Lead>("lead.create", input);
}

// ---- businesses --------------------------------------------------------

export function createBusiness(input: {
  lead_id: number;
  business_name: string;
  website_url?: string | null;
  domain?: string | null;
  category: string;
  city?: string | null;
  service_area?: string | null;
  services: string[];
}) {
  return callDbApi<Business>("business.create", input);
}

export function getBusiness(id: number) {
  return callDbApi<Business>("business.get", { id });
}

// ---- audits --------------------------------------------------------

export function createAudit(input: {
  business_id: number;
  query_count: number;
  providers_count: number;
  total_checks: number;
  status: string;
}) {
  return callDbApi<Audit>("audit.create", input);
}

export function getAudit(id: number) {
  return callDbApi<Audit>("audit.get", { id });
}

export function updateAudit(
  id: number,
  fields: Partial<{
    status: string;
    recommended_count: number;
    overall_visibility_score: number;
    completed_at: string;
  }>
) {
  return callDbApi<Audit>("audit.update", { id, ...fields });
}

// ---- queries --------------------------------------------------------

export function createQueries(
  auditId: number,
  queries: { query_text: string; query_type: QueryType; language: Language; location: string | null }[]
) {
  return callDbApi<AuditQuery[]>("query.createMany", { audit_id: auditId, queries });
}

export function listQueries(auditId: number) {
  return callDbApi<AuditQuery[]>("query.list", { audit_id: auditId });
}

// ---- ai results --------------------------------------------------------

export function createResultPlaceholders(
  auditId: number,
  rows: { query_id: number; provider: ProviderName; model: string }[]
) {
  return callDbApi<AiResult[]>("result.createMany", { audit_id: auditId, rows });
}

export function updateResult(
  id: number,
  fields: Partial<{
    mentioned: boolean;
    recommended: boolean;
    position: number | null;
    business_name_detected: string | null;
    raw_response: string;
    sources_json: string;
    competitors_json: string;
    error_message: string | null;
    checked_at: string;
  }>
) {
  return callDbApi<AiResult>("result.update", { id, ...fields });
}

export function listResults(auditId: number) {
  return callDbApi<AiResult[]>("result.list", { audit_id: auditId });
}

export function listPendingResults(auditId: number, limit: number) {
  return callDbApi<(AiResult & { query_text: string; language: Language; location: string | null })[]>(
    "result.listPending",
    { audit_id: auditId, limit }
  );
}

// ---- admin --------------------------------------------------------

export function adminStats() {
  return callDbApi<{ total_leads: number; total_audits: number; total_checks: number; completed_audits: number }>(
    "admin.stats"
  );
}

export function adminListLeads(input: { from?: string; to?: string; limit?: number; offset?: number }) {
  return callDbApi<{
    items: {
      lead: Lead;
      business: Business | null;
      audit: Audit | null;
    }[];
    total: number;
  }>("admin.leads", input);
}
