"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { MAX_SERVICES } from "@/lib/config";

interface LeadState {
  full_name: string;
  email: string;
  marketing_consent: boolean;
}

interface BusinessState {
  business_name: string;
  website_url: string;
  category: string;
  city: string;
  service_area: string;
  services: string[];
}

const emptyLead: LeadState = { full_name: "", email: "", marketing_consent: false };
const emptyBusiness: BusinessState = {
  business_name: "",
  website_url: "",
  category: "",
  city: "",
  service_area: "",
  services: [""],
};

export function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [lead, setLead] = useState<LeadState>(emptyLead);
  const [business, setBusiness] = useState<BusinessState>(emptyBusiness);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (lead.full_name.trim().length < 2) return setError("נא להזין שם מלא");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return setError("נא להזין כתובת אימייל תקינה");

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בשמירת הפרטים");
      setLeadId(data.lead.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setLoading(false);
    }
  }

  async function submitBusiness(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!leadId) return setError("יש להתחיל מחדש");
    if (business.business_name.trim().length < 2) return setError("נא להזין שם עסק");
    if (business.category.trim().length < 2) return setError("נא להזין תחום פעילות");
    const services = business.services.map((s) => s.trim()).filter(Boolean);
    if (services.length === 0) return setError("נא להזין לפחות שירות אחד");

    setLoading(true);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          business_name: business.business_name.trim(),
          website_url: business.website_url.trim() || undefined,
          category: business.category.trim(),
          city: business.city.trim() || undefined,
          service_area: business.service_area.trim() || undefined,
          services,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה ביצירת הבדיקה");
      router.push(`/audit/${data.auditId}/running`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
      setLoading(false);
    }
  }

  function updateService(index: number, value: string) {
    setBusiness((b) => {
      const services = [...b.services];
      services[index] = value;
      return { ...b, services };
    });
  }

  function addService() {
    setBusiness((b) => (b.services.length >= MAX_SERVICES ? b : { ...b, services: [...b.services, ""] }));
  }

  function removeService(index: number) {
    setBusiness((b) => ({ ...b, services: b.services.filter((_, i) => i !== index) }));
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-14">
      <div className="mb-8 flex items-center justify-center gap-2">
        <StepDot active={step === 1} done={step > 1} label="1" />
        <div className="h-px w-10 bg-border" />
        <StepDot active={step === 2} done={false} label="2" />
      </div>

      <Card className="p-8">
        {step === 1 && (
          <form onSubmit={submitLead} className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-ink">קצת עליכם</h2>
              <p className="mt-1 text-sm text-ink-muted">כדי שנוכל לשלוח אליכם את הדוח.</p>
            </div>
            <FieldWrapper label="שם מלא" required>
              <Input
                value={lead.full_name}
                onChange={(e) => setLead({ ...lead, full_name: e.target.value })}
                placeholder="ישראל ישראלי"
                autoComplete="name"
              />
            </FieldWrapper>
            <FieldWrapper label="כתובת אימייל" required>
              <Input
                type="email"
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
                placeholder="you@business.co.il"
                autoComplete="email"
                dir="ltr"
              />
            </FieldWrapper>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                checked={lead.marketing_consent}
                onChange={(e) => setLead({ ...lead, marketing_consent: e.target.checked })}
              />
              אני מאשר/ת קבלת עדכונים ותכנים שיווקיים במייל
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? "שומר..." : "המשך לפרטי העסק"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitBusiness} className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-ink">ספרו לנו על העסק</h2>
              <p className="mt-1 text-sm text-ink-muted">
                המידע הזה ישמש ליצירת שאילתות חיפוש שלקוחות אמיתיים עשויים לשאול.
              </p>
            </div>
            <FieldWrapper label="שם העסק" required>
              <Input
                value={business.business_name}
                onChange={(e) => setBusiness({ ...business, business_name: e.target.value })}
                placeholder="Odesign"
              />
            </FieldWrapper>
            <FieldWrapper label="כתובת האתר" hint="לא חובה - אם קיים, ננסה לחלץ ממנו מידע נוסף">
              <Input
                value={business.website_url}
                onChange={(e) => setBusiness({ ...business, website_url: e.target.value })}
                placeholder="https://example.co.il"
                dir="ltr"
              />
            </FieldWrapper>
            <FieldWrapper label="תחום פעילות" required>
              <Input
                value={business.category}
                onChange={(e) => setBusiness({ ...business, category: e.target.value })}
                placeholder="בניית אתרים ושיווק דיגיטלי"
              />
            </FieldWrapper>
            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="עיר">
                <Input
                  value={business.city}
                  onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                  placeholder="בני ברק"
                />
              </FieldWrapper>
              <FieldWrapper label="אזור שירות">
                <Input
                  value={business.service_area}
                  onChange={(e) => setBusiness({ ...business, service_area: e.target.value })}
                  placeholder="כל הארץ / מרכז"
                />
              </FieldWrapper>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                שירותים מרכזיים <span className="text-danger">*</span>
              </span>
              <div className="flex flex-col gap-2">
                {business.services.map((service, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={service}
                      onChange={(e) => updateService(i, e.target.value)}
                      placeholder={`שירות ${i + 1}`}
                    />
                    {business.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(i)}
                        className="shrink-0 rounded-xl border border-border px-3 text-sm text-ink-muted hover:bg-surface"
                        aria-label="הסר שירות"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {business.services.length < MAX_SERVICES && (
                <button
                  type="button"
                  onClick={addService}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  + הוסף שירות
                </button>
              )}
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                חזרה
              </Button>
              <Button type="submit" size="lg" disabled={loading} className="flex-1">
                {loading ? "מתחילים בדיקה..." : "התחילו את הבדיקה"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
        active
          ? "bg-primary text-primary-contrast"
          : done
            ? "bg-primary/15 text-primary"
            : "bg-ink/5 text-ink-muted"
      }`}
    >
      {label}
    </div>
  );
}
