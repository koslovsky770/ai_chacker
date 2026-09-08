// Anthropic / Claude provider - Messages API with the web_search tool.

import Anthropic from "@anthropic-ai/sdk";
import { AI_SYSTEM_PROMPT, PROVIDERS } from "../config";
import type { SourceRef } from "../types";
import type { ProviderCallInput, ProviderCallResult } from "./types";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function callAnthropic(input: ProviderCallInput): Promise<ProviderCallResult> {
  const anthropic = getClient();

  const userPrompt =
    input.language === "he"
      ? `שאלה של לקוח: ${input.query}${input.location ? `\n(האזור הרלוונטי: ${input.location})` : ""}`
      : `Customer question: ${input.query}${input.location ? `\n(Relevant area: ${input.location})` : ""}`;

  const message = await anthropic.messages.create({
    model: PROVIDERS.anthropic.model,
    max_tokens: 1500,
    system: AI_SYSTEM_PROMPT(input.language),
    messages: [{ role: "user", content: userPrompt }],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
        user_location: {
          type: "approximate",
          country: "IL",
          city: input.location || undefined,
        },
      },
    ],
  });

  let rawText = "";
  const sources: SourceRef[] = [];
  const seen = new Set<string>();

  for (const block of message.content) {
    if (block.type === "text") {
      rawText += block.text + "\n";
    } else if (block.type === "web_search_tool_result") {
      const content = block.content;
      if (Array.isArray(content)) {
        for (const result of content) {
          if (result.type === "web_search_result" && result.url && !seen.has(result.url)) {
            seen.add(result.url);
            let domain = "";
            try {
              domain = new URL(result.url).hostname.replace(/^www\./, "");
            } catch {
              domain = "";
            }
            if (domain) sources.push({ url: result.url, domain, title: result.title });
          }
        }
      }
    }
  }

  return { rawText: rawText.trim(), sources };
}
