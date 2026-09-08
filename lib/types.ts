// Shared domain types used across the app (API routes, providers, UI).

export type ProviderName = "openai" | "gemini" | "anthropic";

export type QueryType =
  | "direct_service"
  | "geographic"
  | "problem_need"
  | "specialization"
  | "high_intent"
  | "comparative";

export type Language = "he" | "en";

export type AuditStatus = "pending" | "processing" | "completed" | "failed";

export interface Lead {
  id: number;
  full_name: string;
  email: string;
  marketing_consent: boolean;
  created_at: string;
}

export interface Business {
  id: number;
  lead_id: number;
  business_name: string;
  website_url: string | null;
  domain: string | null;
  category: string;
  city: string | null;
  service_area: string | null;
  services: string[];
  created_at: string;
  updated_at: string;
}

export interface Audit {
  id: number;
  business_id: number;
  status: AuditStatus;
  query_count: number;
  providers_count: number;
  total_checks: number;
  recommended_count: number;
  overall_visibility_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AuditQuery {
  id: number;
  audit_id: number;
  query_text: string;
  query_type: QueryType;
  language: Language;
  location: string | null;
  created_at: string;
}

export interface SourceRef {
  url: string;
  domain: string;
  title?: string;
}

export interface CompetitorRef {
  name: string;
  normalized: string;
}

export interface AiResult {
  id: number;
  audit_id: number;
  query_id: number;
  provider: ProviderName;
  model: string;
  mentioned: boolean | null;
  recommended: boolean | null;
  position: number | null;
  business_name_detected: string | null;
  raw_response: string | null;
  sources: SourceRef[];
  competitors: CompetitorRef[];
  error_message: string | null;
  checked_at: string | null;
}

export interface AuditFull {
  audit: Audit;
  business: Business;
  queries: AuditQuery[];
  results: AiResult[];
}

// Business-scraped info extracted from the website (best-effort, homepage + a few key pages).
export interface ScrapedBusinessInfo {
  business_name?: string;
  category?: string;
  services?: string[];
  city?: string;
  service_area?: string;
  target_audience?: string;
}

export interface BusinessFormInput {
  business_name: string;
  website_url?: string;
  category: string;
  city?: string;
  service_area?: string;
  services: string[];
}

export interface LeadFormInput {
  full_name: string;
  email: string;
  marketing_consent: boolean;
}
