"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldWrapper, Input, Textarea } from "@/components/ui/Field";
import { ProviderMark } from "@/components/ui/ProviderMark";
import { PROVIDERS } from "@/lib/config";
import type { ProviderName } from "@/lib/types";

interface DemoResult {
  provider: ProviderName;
  ok: boolean;
  error?: string;
  rawText?: string;
  mentioned?: boolean;
  recommended?: boolean;
  position?: number | null;
  sources?: { url: string; domain: string; title?: string }[];
}

export function DemoCheck() {
  const [query, setQuery] = useState("מי מומלץ לבניית אתרים באזור המרכז?");
  const [businessName, setBusinessName] = useState("Odesign");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DemoResult[] | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults(null);
    setLoading(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, businessName, websiteUrl: websiteUrl || undefined, language: "he" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בבדיקה");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldWrapper label="שאילתה (בדיוק כמו שלקוח היה כותב)" required>
            <Textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={2} />
          </FieldWrapper>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="שם העסק לבדיקה" required>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="אתר (לא חובה)">
              <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} dir="ltr" placeholder="https://..." />
            </FieldWrapper>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "בודק בלייב מול שלושת המנועים..." : "בדוק עכשיו (דמו - לא נשמר)"}
          </Button>
        </form>
      </Card>

      {results && (
        <div className="flex flex-col gap-4">
          {results.map((r) => (
            <Card key={r.provider} className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <ProviderMark provider={r.provider} />
                  {PROVIDERS[r.provider].label}
                </span>
                {r.ok ? (
                  <span className={`text-sm font-medium ${r.recommended ? "text-success" : "text-ink-muted"}`}>
                    {r.recommended
                      ? `✅ הופיע בהמלצות${r.position ? ` (מקום ${r.position})` : ""}`
                      : r.mentioned
                        ? "⚠️ הוזכר, אך לא כהמלצה ברורה"
                        : "✕ לא הופיע בתשובה זו"}
                  </span>
                ) : (
                  <span className="text-sm text-warning">שגיאה: {r.error}</span>
                )}
              </div>
              {r.ok && r.rawText && (
                <details className="text-sm text-ink-muted">
                  <summary className="cursor-pointer font-medium text-ink">הצג את התשובה המלאה</summary>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed">{r.rawText}</p>
                  {r.sources && r.sources.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-1 font-medium text-ink">מקורות שצוטטו:</p>
                      <ul className="list-disc pr-5">
                        {r.sources.map((s) => (
                          <li key={s.url} dir="ltr" className="truncate">
                            {s.domain}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </details>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
