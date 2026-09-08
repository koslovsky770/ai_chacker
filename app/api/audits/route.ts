import { NextRequest, NextResponse } from "next/server";
import { ACTIVE_QUERY_COUNT, DEFAULT_LANGUAGE, PROVIDERS, activeProviders } from "@/lib/config";
import { createAudit, createBusiness, createQueries, createResultPlaceholders, DbApiError } from "@/lib/db";
import { generateQueries } from "@/lib/queries/generate";
import { extractDomain } from "@/lib/normalize";
import { scrapeWebsite } from "@/lib/scrape";
import { businessSchema } from "@/lib/validation";
import type { BusinessFormInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו JSON תקין" }, { status: 400 });
  }

  const parsed = businessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  // Best-effort enrichment from the website. Manual user input always wins.
  let scraped: Awaited<ReturnType<typeof scrapeWebsite>> = null;
  if (input.website_url) {
    scraped = await scrapeWebsite(input.website_url).catch(() => null);
  }

  const businessName = input.business_name || scraped?.business_name || "";
  if (!businessName) {
    return NextResponse.json({ error: "יש להזין שם עסק" }, { status: 400 });
  }

  const domain = input.website_url ? extractDomain(input.website_url) : null;

  try {
    const business = await createBusiness({
      lead_id: input.lead_id,
      business_name: businessName,
      website_url: input.website_url || null,
      domain,
      category: input.category || scraped?.category || "",
      city: input.city || null,
      service_area: input.service_area || null,
      services: input.services,
    });

    const businessInputForQueries: BusinessFormInput = {
      business_name: business.business_name,
      website_url: business.website_url || undefined,
      category: business.category,
      city: business.city || undefined,
      service_area: business.service_area || undefined,
      services: business.services,
    };

    const generated = generateQueries(businessInputForQueries, ACTIVE_QUERY_COUNT, DEFAULT_LANGUAGE);
    const providers = activeProviders();
    const totalChecks = generated.length * providers.length;

    const audit = await createAudit({
      business_id: business.id,
      query_count: generated.length,
      providers_count: providers.length,
      total_checks: totalChecks,
      status: "processing",
    });

    const queries = await createQueries(audit.id, generated);

    const rows = queries.flatMap((q) =>
      providers.map((provider) => ({ query_id: q.id, provider, model: PROVIDERS[provider].model }))
    );
    await createResultPlaceholders(audit.id, rows);

    return NextResponse.json({ auditId: audit.id, businessId: business.id });
  } catch (err) {
    const message = err instanceof DbApiError ? err.message : "שגיאה ביצירת הבדיקה";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
