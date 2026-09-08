import type { Language, SourceRef } from "../types";

export interface ProviderCallInput {
  query: string;
  language: Language;
  location: string | null;
}

export interface ProviderCallResult {
  rawText: string;
  sources: SourceRef[];
}

export type ProviderFn = (input: ProviderCallInput) => Promise<ProviderCallResult>;
