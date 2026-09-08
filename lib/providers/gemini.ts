// Google Gemini provider - Gemini API with Grounding with Google Search.

import { GoogleGenAI } from "@google/genai";
import { AI_SYSTEM_PROMPT, PROVIDERS } from "../config";
import type { SourceRef } from "../types";
import type { ProviderCallInput, ProviderCallResult } from "./types";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function callGemini(input: ProviderCallInput): Promise<ProviderCallResult> {
  const ai = getClient();

  const locationLine = input.location
    ? input.language === "he"
      ? `\n(האזור הרלוונטי ללקוח: ${input.location}, ישראל)`
      : `\n(Relevant area for the customer: ${input.location}, Israel)`
    : "";

  const response = await ai.models.generateContent({
    model: PROVIDERS.gemini.model,
    contents: `${input.query}${locationLine}`,
    config: {
      systemInstruction: AI_SYSTEM_PROMPT(input.language),
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = response.text || "";
  const sources: SourceRef[] = [];
  const seen = new Set<string>();

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  for (const chunk of chunks) {
    const web = chunk.web;
    if (web?.uri) {
      let domain = web.domain;
      if (!domain) {
        try {
          domain = new URL(web.uri).hostname.replace(/^www\./, "");
        } catch {
          domain = undefined;
        }
      }
      if (domain && !seen.has(web.uri)) {
        seen.add(web.uri);
        sources.push({ url: web.uri, domain, title: web.title });
      }
    }
  }

  return { rawText, sources };
}
