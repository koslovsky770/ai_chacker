import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FULL_REPORT_CTA_URL } from "@/lib/config";

export function CTASection() {
  return (
    <Card className="bg-primary p-8 text-center text-primary-contrast">
      <h2 className="text-xl font-bold">רוצה להבין למה המתחרים מופיעים ואתה פחות?</h2>
      <p className="mx-auto mt-3 max-w-xl leading-relaxed text-primary-contrast/85">
        בדיקת הנראות מראה מה קורה היום. בדוח המלא נבדוק למה זה קורה - ומה צריך לשפר באתר ובנוכחות
        הדיגיטלית כדי לחזק את הסיכוי להופיע בתשובות AI.
      </p>
      <div className="mt-6">
        <LinkButton href={FULL_REPORT_CTA_URL} variant="secondary" size="lg">
          אני רוצה את הדוח המלא
        </LinkButton>
      </div>
    </Card>
  );
}
