// Single entry point used by the audit runner - dispatches to the right
// provider (or the mock), applies a bounded retry, and never throws: a
// failure is turned into an error string so one bad provider call can never
// fail the whole audit.

import { MOCK_AI, PROVIDERS, RETRY_LIMIT } from "../config";
import type { ProviderName } from "../types";
import { callAnthropic } from "./anthropic";
import { callGemini } from "./gemini";
import { mockProviderCall } from "./mock";
import { callOpenAi } from "./openai";
import type { ProviderCallInput, ProviderCallResult } from "./types";

const REAL_IMPLS: Record<ProviderName, (input: ProviderCallInput) => Promise<ProviderCallResult>> = {
  openai: callOpenAi,
  gemini: callGemini,
  anthropic: callAnthropic,
};

export interface RunProviderResult {
  ok: true;
  rawText: string;
  sources: ProviderCallResult["sources"];
}
export interface RunProviderError {
  ok: false;
  error: string;
}

export async function runProvider(
  provider: ProviderName,
  input: ProviderCallInput,
  targetBusinessName: string
): Promise<RunProviderResult | RunProviderError> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RETRY_LIMIT; attempt++) {
    try {
      const result = MOCK_AI
        ? await mockProviderCall(PROVIDERS[provider].label, input, targetBusinessName)
        : await REAL_IMPLS[provider](input);
      return { ok: true, rawText: result.rawText, sources: result.sources };
    } catch (err) {
      lastError = err;
    }
  }

  const message = lastError instanceof Error ? lastError.message : "Unknown provider error";
  return { ok: false, error: message.slice(0, 500) };
}
