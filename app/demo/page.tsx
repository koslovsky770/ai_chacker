import { DemoCheck } from "@/components/demo/DemoCheck";

export const metadata = { title: "דמו חי - בדיקת AI | AI Visibility Checker" };

export default function DemoPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink">דמו חי - בדיקה מול AI</h1>
        <p className="mt-2 text-sm text-ink-muted">
          מסך זה שולח שאילתה אחת בלייב אל ChatGPT, Gemini ו-Claude ומציג את התשובה האמיתית -{" "}
          <strong>בלי לשמור שום דבר במסד נתונים</strong>. זו לא הזרימה המלאה של המוצר (שכוללת איסוף
          פרטים, יצירת מספר שאילתות ודוח שמור) - רק הדגמה של מנגנון הבדיקה עצמו.
        </p>
      </div>
      <DemoCheck />
    </div>
  );
}
