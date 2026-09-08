import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "האם ה-AI ממליץ על העסק שלך? | בודק נראות AI",
  description:
    "בדיקה אחת תגלה אם ChatGPT, Gemini ו-Claude מציגים את העסק שלך כאשר לקוחות מחפשים שירות כמו שלך.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface text-ink">{children}</body>
    </html>
  );
}
