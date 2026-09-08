// Name / domain normalization so we can recognize a business across spelling
// variations (e.g. "Odesign" / "O Design" / "אודיזיין").

const HEBREW_FINAL_LETTERS: Record<string, string> = {
  "ך": "כ",
  "ם": "מ",
  "ן": "נ",
  "ף": "פ",
  "ץ": "צ",
};

export function normalizeText(input: string): string {
  let s = input.normalize("NFKD");
  // strip diacritics/niqqud
  s = s.replace(/[̀-֑ͯ-ׇ]/g, "");
  s = s
    .split("")
    .map((ch) => HEBREW_FINAL_LETTERS[ch] || ch)
    .join("");
  s = s.toLowerCase();
  // drop punctuation, keep letters/digits/spaces (unicode-aware)
  s = s.replace(/[^\p{L}\p{N}\s]/gu, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function normalizeCompact(input: string): string {
  return normalizeText(input).replace(/\s+/g, "");
}

export function extractDomain(urlOrDomain: string): string | null {
  if (!urlOrDomain) return null;
  let value = urlOrDomain.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

export function domainRoot(domain: string | null): string | null {
  if (!domain) return null;
  const parts = domain.split(".");
  if (parts.length <= 1) return domain;
  // handle common il second-level domains (co.il, org.il, net.il) plus generic 2-part TLDs
  const secondLevel = new Set(["co", "org", "net", "gov", "ac", "k12", "com"]);
  if (parts.length >= 3 && secondLevel.has(parts[parts.length - 2])) {
    return parts[parts.length - 3];
  }
  return parts[parts.length - 2];
}

export interface NameVariantSet {
  variants: string[]; // normalized (spaced) variants
  compactVariants: string[]; // normalized, no-space variants
  domain: string | null;
  domainRoot: string | null;
}

export function buildNameVariants(businessName: string, websiteDomain: string | null): NameVariantSet {
  const base = normalizeText(businessName);
  const variants = new Set<string>([base]);

  // split on internal camel-case boundaries e.g. "ODesign" -> "o design"
  const camelSplit = businessName.replace(/([a-z])([A-Z])/g, "$1 $2");
  variants.add(normalizeText(camelSplit));

  const root = domainRoot(websiteDomain);
  if (root && root.length > 1) {
    variants.add(normalizeText(root));
  }

  const compactVariants = Array.from(variants)
    .map((v) => v.replace(/\s+/g, ""))
    .filter((v) => v.length > 1);

  return {
    variants: Array.from(variants).filter((v) => v.length > 1),
    compactVariants: Array.from(new Set(compactVariants)),
    domain: websiteDomain,
    domainRoot: root,
  };
}

export function textContainsVariant(text: string, variants: NameVariantSet): boolean {
  const normalized = normalizeText(text);
  const compactNormalized = normalized.replace(/\s+/g, "");
  if (variants.variants.some((v) => v.length > 2 && normalized.includes(v))) return true;
  if (variants.compactVariants.some((v) => v.length > 2 && compactNormalized.includes(v))) return true;
  return false;
}
