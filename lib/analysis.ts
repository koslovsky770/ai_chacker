// Turns a raw AI text response into structured signals: was the business
// mentioned, was it actually recommended, at what position, who else showed
// up (competitors), and which sources were cited.
//
// This is heuristic by nature (free-form model text, not a structured API),
// so it is documented and kept in one place to make it easy to improve.

import { buildNameVariants, normalizeText, textContainsVariant } from "./normalize";
import type { CompetitorRef, SourceRef } from "./types";

const LIST_ITEM_RE = /^\s*(?:\d{1,2}[.)]|[-*•])\s+/;
const BOLD_HEADER_RE = /^\s*\*\*([^*]{2,80})\*\*/;

interface Block {
  text: string;
  index: number; // 1-based position in the detected list, if any
}

function splitIntoBlocks(text: string): Block[] {
  const lines = text.split(/\r?\n/);
  const blocks: Block[] = [];
  let current: string[] = [];
  let position = 0;
  let sawListItem = false;

  const flush = () => {
    if (current.length) {
      blocks.push({ text: current.join("\n"), index: position });
      current = [];
    }
  };

  for (const line of lines) {
    if (LIST_ITEM_RE.test(line) || BOLD_HEADER_RE.test(line)) {
      flush();
      position += 1;
      sawListItem = true;
    }
    current.push(line);
  }
  flush();

  if (!sawListItem) {
    // No clear list structure detected - treat whole text as a single block.
    return [{ text, index: 0 }];
  }
  return blocks;
}

function extractCandidateName(blockText: string): string | null {
  const firstLine = blockText.split(/\r?\n/)[0] || "";
  let name = firstLine.replace(LIST_ITEM_RE, "");
  const boldMatch = name.match(/^\*\*([^*]{2,80})\*\*/);
  if (boldMatch) {
    name = boldMatch[1];
  } else {
    // cut at first strong separator (dash / colon / em dash / comma)
    name = name.split(/[-–—:|,]/)[0];
  }
  name = name.replace(/\*/g, "").trim();
  if (!name || name.length < 2 || name.length > 80) return null;
  return name;
}

export interface AnalysisInput {
  rawText: string;
  sources: SourceRef[];
  businessName: string;
  websiteDomain: string | null;
}

export interface AnalysisResult {
  mentioned: boolean;
  recommended: boolean;
  position: number | null;
  business_name_detected: string | null;
  competitors: CompetitorRef[];
}

export function analyzeResponse(input: AnalysisInput): AnalysisResult {
  const { rawText, sources, businessName, websiteDomain } = input;
  const variants = buildNameVariants(businessName, websiteDomain);

  const blocks = splitIntoBlocks(rawText);
  const hasListStructure = blocks.length > 1 || blocks[0]?.index !== 0;

  let recommended = false;
  let position: number | null = null;
  let detectedName: string | null = null;
  const competitors: CompetitorRef[] = [];
  const seenCompetitorKeys = new Set<string>();

  for (const block of blocks) {
    const isMatch = textContainsVariant(block.text, variants);
    const candidate = extractCandidateName(block.text);

    if (isMatch) {
      recommended = true;
      if (position === null && block.index > 0) position = block.index;
      if (!detectedName) detectedName = candidate || businessName;
    } else if (candidate && hasListStructure && block.index > 0) {
      // Only real list items (not the intro paragraph before the first
      // numbered/bulleted entry) are treated as competitor candidates.
      const key = normalizeText(candidate).replace(/\s+/g, "");
      if (key.length > 1 && !seenCompetitorKeys.has(key)) {
        seenCompetitorKeys.add(key);
        competitors.push({ name: candidate, normalized: key });
      }
    }
  }

  // Fallback: no list structure at all, just check free text.
  if (!hasListStructure && textContainsVariant(rawText, variants)) {
    recommended = true;
    detectedName = detectedName || businessName;
  }

  const mentionedInSources = sources.some((s) => {
    if (!s.domain) return false;
    const domainNoTld = s.domain.split(".")[0];
    return (
      (variants.domainRoot && s.domain.includes(variants.domainRoot)) ||
      variants.compactVariants.some((v) => domainNoTld.includes(v) || v.includes(domainNoTld))
    );
  });

  const mentioned = recommended || mentionedInSources || textContainsVariant(rawText, variants);

  return {
    mentioned,
    recommended,
    position,
    business_name_detected: detectedName,
    competitors: competitors.slice(0, 15),
  };
}
