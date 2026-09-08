// Best-effort website scraping: homepage + a couple of likely "About /
// Services / Contact" pages. Used only to pre-fill the business form -
// whatever the user types manually always wins over anything scraped here.

import type { ScrapedBusinessInfo } from "./types";

const CANDIDATE_PATHS = [
  "/about",
  "/about-us",
  "/services",
  "/contact",
  "/עלינו",
  "/אודות",
  "/שירותים",
  "/צור-קשר",
];

const FETCH_TIMEOUT_MS = 6000;
const MAX_PAGES = 3;

async function fetchWithTimeout(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIVisibilityBot/1.0)" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const match = html.match(re);
  return match ? match[1].trim() : null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function findInternalLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const re = /<a[^>]+href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const href = match[1];
    try {
      const abs = new URL(href, baseUrl);
      if (abs.hostname === new URL(baseUrl).hostname) {
        const lower = abs.pathname.toLowerCase();
        if (CANDIDATE_PATHS.some((p) => lower.includes(p))) {
          links.add(abs.toString());
        }
      }
    } catch {
      // ignore malformed URLs
    }
  }
  return Array.from(links).slice(0, MAX_PAGES - 1);
}

export async function scrapeWebsite(rawUrl: string): Promise<ScrapedBusinessInfo | null> {
  let base: string;
  try {
    base = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    new URL(base);
  } catch {
    return null;
  }

  const homeHtml = await fetchWithTimeout(base);
  if (!homeHtml) return null;

  const pagesText: string[] = [stripHtml(homeHtml)];
  const extraLinks = findInternalLinks(homeHtml, base);
  const extraPages = await Promise.all(extraLinks.map((l) => fetchWithTimeout(l)));
  for (const html of extraPages) {
    if (html) pagesText.push(stripHtml(html));
  }

  const description = extractMeta(homeHtml, "description") || extractMeta(homeHtml, "og:description");
  const ogTitle = extractMeta(homeHtml, "og:site_name") || extractTitle(homeHtml);

  // Pages text is fetched (homepage + about/services/contact) so a future
  // pass can mine services/city/audience from it with an LLM call; for now
  // we only surface the cheap, reliable signals (title + meta description).
  return {
    business_name: ogTitle || undefined,
    category: description ? description.slice(0, 160) : undefined,
  };
}
