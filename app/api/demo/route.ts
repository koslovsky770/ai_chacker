import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeResponse } from "@/lib/analysis";
import { mapWithConcurrency } from "@/lib/concurrency";
import { activeProviders } from "@/lib/config";
import { extractDomain } from "@/lib/normalize";
import { runProvider } from "@/lib/providers";

// Stateless demo endpoint: runs a single query against all active AI
// providers and returns the analysis directly. Nothing is written to the
// database - this exists purely so the live checking behavior can be seen
// without a database API configured (e.g. on a UI-only preview deployment).
export const maxDuration = 60;

const demoSchema = z.object({
  query: z.string().trim().min(5).max(500),
  businessName: z.string().trim().min(2).max(255),
  websiteUrl: z.string().trim().max(500).optional().nullable(),
  language: z.enum(["he", "en"]).optional().default("he"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו JSON תקין" }, { status: 400 });
  }

  const parsed = demoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים", details: parsed.error.flatten() }, { status: 400 });
  }
  const { query, businessName, websiteUrl, language } = parsed.data;
  const websiteDomain = websiteUrl ? extractDomain(websiteUrl) : null;

  const providers = activeProviders();

  const results = await mapWithConcurrency(providers, providers.length, async (provider) => {
    const outcome = await runProvider(provider, { query, language, location: null }, businessName);

    if (!outcome.ok) {
      return { provider, ok: false as const, error: outcome.error };
    }

    const analysis = analyzeResponse({
      rawText: outcome.rawText,
      sources: outcome.sources,
      businessName,
      websiteDomain,
    });

    return {
      provider,
      ok: true as const,
      rawText: outcome.rawText,
      sources: outcome.sources,
      ...analysis,
    };
  });

  return NextResponse.json({ query, results });
}
