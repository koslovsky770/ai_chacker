import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProviderLabel } from "@/components/ui/ProviderMark";
import { ACTIVE_QUERY_COUNT } from "@/lib/config";

const steps = [
  {
    title: "מספרים לנו על העסק",
    text: "שם העסק, תחום פעילות, עיר ואזור שירות, והשירותים המרכזיים שלכם.",
  },
  {
    title: "אנחנו שואלים כמו לקוח אמיתי",
    text: `יוצרים ${ACTIVE_QUERY_COUNT} שאילתות חיפוש טבעיות - בלי להזכיר את שם העסק שלכם.`,
  },
  {
    title: "בודקים בשלושת מנועי ה-AI המובילים",
    text: "ChatGPT, Gemini ו-Claude, עם חיפוש אינטרנט חי ומעודכן.",
  },
  {
    title: "מקבלים דוח נראות ברור",
    text: "כמה פעמים הומלצתם, מי המתחרים שמופיעים במקומכם, ועל אילו מקורות ה-AI מסתמך.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold text-ink">AI Visibility Checker</span>
        <LinkButton href="/check" variant="secondary" size="md">
          בדקו את העסק שלי
        </LinkButton>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-16 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-1.5 text-xs font-medium text-ink-muted">
          כלי בדיקה ל-ChatGPT · Gemini · Claude
        </span>
        <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
          האם ה-AI ממליץ על העסק שלך?
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
          בדיקה אחת תגלה אם ChatGPT, Gemini ו-Claude מציגים את העסק שלך כאשר לקוחות מחפשים שירות כמו
          שלך.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <LinkButton href="/check" size="lg">
            בדקו את העסק שלי
          </LinkButton>
          <span className="text-xs text-ink-muted">ללא צורך בכרטיס אשראי · תוצאות תוך דקות</span>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <ProviderLabel provider="openai" />
          <ProviderLabel provider="gemini" />
          <ProviderLabel provider="anthropic" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold text-ink">איך זה עובד</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Card key={step.title} className="p-6">
              <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mb-2 font-semibold text-ink">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-24">
        <Card className="p-8 text-center">
          <h2 className="mb-3 text-xl font-bold text-ink">למה זה חשוב עכשיו?</h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-ink-muted">
            יותר ולקוחות פוטנציאליים שואלים את ChatGPT, Gemini ו-Claude &quot;מי מומלץ&quot; לפני שהם
            פותחים חיפוש רגיל בגוגל. אם ה-AI לא מכיר את העסק שלכם, אתם עלולים לפספס לקוחות עוד לפני
            שהם הגיעו לאתר שלכם.
          </p>
          <div className="mt-6">
            <LinkButton href="/check" size="lg">
              בדקו את העסק שלי עכשיו
            </LinkButton>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} AI Visibility Checker.{" "}
        <a href="/admin" className="underline hover:text-ink">
          כניסת מנהל
        </a>
      </footer>
    </div>
  );
}
