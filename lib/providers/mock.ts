// MOCK_AI=true implementation - returns deterministic-ish fake results so
// the UI/report can be built and demoed without spending real API credits.

import type { ProviderCallInput, ProviderCallResult } from "./types";

const MOCK_COMPETITORS_HE = ["דיגיטל פרו", "וובסטודיו", "פיקסל אנד קוד", "נטליין", "סטודיו קליק"];
const MOCK_COMPETITORS_EN = ["Digital Pro", "WebStudio", "Pixel & Code", "NetLine", "Click Studio"];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export async function mockProviderCall(
  providerLabel: string,
  input: ProviderCallInput,
  targetBusinessName: string
): Promise<ProviderCallResult> {
  // small artificial delay so the progress UI has something to show
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

  const seed = hash(providerLabel + input.query);
  const competitors = input.language === "he" ? MOCK_COMPETITORS_HE : MOCK_COMPETITORS_EN;
  const includeTarget = seed % 3 === 0; // ~1/3 of mock results "recommend" the business

  const items: string[] = [];
  const shuffled = [...competitors].sort((a, b) => ((hash(a + seed) % 7) - (hash(b + seed) % 7)));
  const targetPosition = seed % 4;

  for (let i = 0; i < 4; i++) {
    if (includeTarget && i === targetPosition) {
      items.push(
        input.language === "he"
          ? `**${targetBusinessName}** - ספק מקומי מומלץ עם ביקורות טובות, מתאים לצורך שתיארת.`
          : `**${targetBusinessName}** - a well-reviewed local provider that fits what you described.`
      );
    } else {
      const name = shuffled[i % shuffled.length];
      items.push(
        input.language === "he"
          ? `**${name}** - חברה מוכרת בתחום עם נוכחות דיגיטלית מסודרת.`
          : `**${name}** - a known company in the field with a solid online presence.`
      );
    }
  }

  const intro =
    input.language === "he"
      ? `בהתבסס על חיפוש עדכני, הנה כמה אפשרויות מומלצות:`
      : `Based on a recent search, here are a few recommended options:`;

  const rawText = [intro, ...items.map((it, i) => `${i + 1}. ${it}`)].join("\n\n");

  const sources = shuffled.slice(0, 3).map((name, i) => ({
    url: `https://example-${i}.com/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`,
    domain: `example-${i}.com`,
    title: name,
  }));

  return { rawText, sources };
}
