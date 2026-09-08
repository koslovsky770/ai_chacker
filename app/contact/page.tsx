import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "הדוח המלא | AI Visibility Checker" };

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-14">
      <Card className="w-full p-8 text-center">
        <h1 className="text-xl font-bold text-ink">רוצים את הדוח המלא?</h1>
        <p className="mt-3 leading-relaxed text-ink-muted">
          השאירו פרטים ונחזור אליכם עם ניתוח מעמיק של מה צריך לשפר באתר ובנוכחות הדיגיטלית שלכם כדי
          לחזק את הסיכוי להופיע בתשובות AI.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          אפשר גם לפנות ישירות במייל:{" "}
          <a href="mailto:hello@example.com" className="font-medium text-primary" dir="ltr">
            hello@example.com
          </a>
        </p>
        <div className="mt-6">
          <LinkButton href="/" variant="secondary">
            חזרה לעמוד הבית
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
