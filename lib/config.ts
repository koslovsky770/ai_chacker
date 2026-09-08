// Central configuration for the whole app.
// IMPORTANT: model names / query counts / concurrency all live here so nothing
// is hard-coded / duplicated elsewhere in the codebase.

import type { ProviderName } from "./types";

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

export const MOCK_AI = envBool("MOCK_AI", false);

// Number of search queries generated per audit. Kept configurable so a
// future "free" vs "full" plan can use different depths without code changes.
export const FREE_QUERY_COUNT = envInt("FREE_QUERY_COUNT", 5);
export const FULL_QUERY_COUNT = envInt("FULL_QUERY_COUNT", 10);
// Which tier is currently active for new audits. Swap to FULL_QUERY_COUNT
// (or read a plan flag from the lead/business) once paid tiers exist.
export const ACTIVE_QUERY_COUNT = envInt("ACTIVE_QUERY_COUNT", FREE_QUERY_COUNT);

// How many provider calls run in parallel at once, across the whole app.
export const AI_CONCURRENCY = envInt("AI_CONCURRENCY", 4);

// How many pending checks a single "process" tick performs before returning
// control to the client. Keeps each serverless invocation short and bounded
// regardless of hosting plan / timeout limits. See README "Architecture".
export const PROCESS_BATCH_SIZE = envInt("PROCESS_BATCH_SIZE", AI_CONCURRENCY);

export const DEFAULT_LANGUAGE = (process.env.DEFAULT_LANGUAGE as "he" | "en") || "he";

export const MAX_SERVICES = 5;

export interface ProviderConfig {
  enabled: boolean;
  model: string;
  label: string;
}

export const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  openai: {
    enabled: envBool("OPENAI_ENABLED", true),
    model: process.env.OPENAI_MODEL || "gpt-4.1",
    label: "ChatGPT",
  },
  gemini: {
    enabled: envBool("GEMINI_ENABLED", true),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    label: "Gemini",
  },
  anthropic: {
    enabled: envBool("ANTHROPIC_ENABLED", true),
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    label: "Claude",
  },
};

export function activeProviders(): ProviderName[] {
  return (Object.keys(PROVIDERS) as ProviderName[]).filter((p) => PROVIDERS[p].enabled);
}

// The single shared system instruction sent to every provider so results are
// comparable. Deliberately does NOT mention the business we're checking for.
export const AI_SYSTEM_PROMPT = (language: "he" | "en") =>
  language === "he"
    ? "ענה כמו עוזר שמסייע ללקוח לבחור ספק או בעל מקצוע. השתמש במידע עדכני מהאינטרנט. הצע רק עסקים שאתה יכול למצוא להם נוכחות ציבורית אמינה (אתר, פרופיל עסקי, אזכורים). תן כמה אפשרויות מתאימות (לא רק אחת ולא עשרות) והסבר בקצרה מדוע כל אחת מתאימה. ענה בעברית."
    : "Answer like an assistant helping a customer choose a vendor or professional. Use up-to-date information from the internet. Only suggest businesses you can find a credible public presence for (website, business profile, mentions). Offer a handful of suitable options (not just one, not dozens) and briefly explain why each fits. Answer in English.";

export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const FULL_REPORT_CTA_URL = process.env.FULL_REPORT_CTA_URL || "/contact";

export const RETRY_LIMIT = envInt("AI_RETRY_LIMIT", 1);
