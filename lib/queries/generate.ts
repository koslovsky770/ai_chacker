// Generates the natural-language "customer style" search queries used to
// probe each AI provider. The business name is NEVER included in a query.

import type { BusinessFormInput, Language, QueryType } from "../types";

export interface GeneratedQuery {
  query_text: string;
  query_type: QueryType;
  language: Language;
  location: string | null;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function heQueries(business: BusinessFormInput): Record<QueryType, string[]> {
  const category = business.category.trim();
  const city = (business.city || "").trim();
  const area = (business.service_area || city || "בישראל").trim();
  const service = business.services[0]?.trim() || category;
  const service2 = business.services[1]?.trim() || category;

  return {
    direct_service: [
      `אילו עסקים מומלצים בתחום ${category}?`,
      `מי מומלץ לספק שירותי ${service}?`,
      `חברות מומלצות בתחום ${category} לעסקים`,
    ],
    geographic: [
      `${category} מומלץ באזור ${area}`,
      city ? `מי מומלץ בתחום ${category} באזור ${city}?` : `מי מומלץ בתחום ${category} בישראל?`,
      `אילו ספקים בתחום ${category} פעילים באזור ${area}?`,
    ],
    problem_need: [
      `אני צריך ${service} לעסק שלי ולא יודע למי לפנות, למי כדאי לפנות?`,
      `אני מחפש ${service} ורוצה גם עזרה ב${service2}. על מי היית ממליץ?`,
      `יש לי צורך ב${service}, איך כדאי לבחור ספק מתאים?`,
    ],
    specialization: [
      `מי מתמחה ב${service} וגם ב${service2}?`,
      `אילו ספקים ב${category} מתמחים בעבודה עם עסקים קטנים?`,
      `מי הכי מקצועי בתחום ${service} כיום?`,
    ],
    high_intent: [
      `על אילו עסקים היית ממליץ בתחום ${category} לעסק קטן?`,
      `תן לי כמה המלצות רציניות לספק ${service} שאפשר לסמוך עליו`,
      `אני רוצה להתחיל לעבוד עם מישהו בתחום ${category} השבוע, למי לפנות?`,
    ],
    comparative: [
      `תן לי כמה חברות מומלצות בתחום ${category} בישראל להשוואה`,
      `מה ההבדל בין הספקים המובילים בתחום ${service} ואיזה מהם הכי מומלץ?`,
      `אילו הן החברות הכי מוכרות בתחום ${category}?`,
    ],
  };
}

function enQueries(business: BusinessFormInput): Record<QueryType, string[]> {
  const category = business.category.trim();
  const city = (business.city || "").trim();
  const area = (business.service_area || city || "in Israel").trim();
  const service = business.services[0]?.trim() || category;
  const service2 = business.services[1]?.trim() || category;

  return {
    direct_service: [
      `What businesses are recommended for ${category}?`,
      `Who would you recommend for ${service} services?`,
      `Recommended companies for ${category} for small businesses`,
    ],
    geographic: [
      `Recommended ${category} providers near ${area}`,
      city ? `Who is recommended for ${category} in ${city}?` : `Who is recommended for ${category} in Israel?`,
      `Which ${category} providers operate in ${area}?`,
    ],
    problem_need: [
      `I need ${service} for my business and don't know who to contact, any recommendations?`,
      `I'm looking for ${service} and also help with ${service2}. Who would you recommend?`,
      `I have a need for ${service}, how should I choose a good provider?`,
    ],
    specialization: [
      `Who specializes in both ${service} and ${service2}?`,
      `Which ${category} providers specialize in working with small businesses?`,
      `Who is considered the most professional in ${service} today?`,
    ],
    high_intent: [
      `Which businesses would you recommend for ${category} for a small business?`,
      `Give me a few solid recommendations for a ${service} provider I can trust`,
      `I want to start working with someone in ${category} this week, who should I contact?`,
    ],
    comparative: [
      `Give me a few recommended ${category} companies in Israel to compare`,
      `What's the difference between the leading ${service} providers and which is most recommended?`,
      `What are the most well-known companies in ${category}?`,
    ],
  };
}

const TYPE_ORDER: QueryType[] = [
  "direct_service",
  "geographic",
  "problem_need",
  "specialization",
  "high_intent",
  "comparative",
];

export function generateQueries(
  business: BusinessFormInput,
  count: number,
  language: Language = "he"
): GeneratedQuery[] {
  const bank = language === "he" ? heQueries(business) : enQueries(business);
  const location = business.service_area || business.city || null;

  const queries: GeneratedQuery[] = [];
  let typeIdx = 0;
  const usedPerType: Record<string, number> = {};

  while (queries.length < count) {
    const type = TYPE_ORDER[typeIdx % TYPE_ORDER.length];
    const options = bank[type];
    const usedCount = usedPerType[type] || 0;
    if (usedCount < options.length) {
      queries.push({
        query_text: pick(options, usedCount),
        query_type: type,
        language,
        location,
      });
      usedPerType[type] = usedCount + 1;
    }
    typeIdx += 1;
    // safety valve: if we've cycled through everything and still short, stop.
    if (typeIdx > TYPE_ORDER.length * 10) break;
  }

  return queries.slice(0, count);
}
