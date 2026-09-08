// OpenAI / ChatGPT provider - Responses API with the hosted web_search tool.

import OpenAI from "openai";
import { AI_SYSTEM_PROMPT, PROVIDERS } from "../config";
import type { SourceRef } from "../types";
import type { ProviderCallInput, ProviderCallResult } from "./types";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured on the server");
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function callOpenAi(input: ProviderCallInput): Promise<ProviderCallResult> {
  const openai = getClient();

  const userPrompt =
    input.language === "he"
      ? `שאלה של לקוח: ${input.query}${input.location ? `\n(האזור הרלוונטי: ${input.location})` : ""}`
      : `Customer question: ${input.query}${input.location ? `\n(Relevant area: ${input.location})` : ""}`;

  const response = await openai.responses.create({
    model: PROVIDERS.openai.model,
    instructions: AI_SYSTEM_PROMPT(input.language),
    input: userPrompt,
    tools: [
      {
        type: "web_search",
        user_location: {
          type: "approximate",
          country: "IL",
          city: input.location || undefined,
        },
      },
    ],
  });

  const rawText = response.output_text || "";
  const sources: SourceRef[] = [];
  const seen = new Set<string>();

  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type !== "output_text") continue;
      for (const annotation of content.annotations || []) {
        if (annotation.type === "url_citation" && annotation.url) {
          try {
            const domain = new URL(annotation.url).hostname.replace(/^www\./, "");
            if (!seen.has(annotation.url)) {
              seen.add(annotation.url);
              sources.push({ url: annotation.url, domain, title: annotation.title });
            }
          } catch {
            // ignore malformed URL
          }
        }
      }
    }
  }

  return { rawText, sources };
}
