import { notFound } from "next/navigation";
import { ProgressScreen } from "@/components/progress/ProgressScreen";

export const metadata = { title: "בודקים את העסק שלך... | AI Visibility Checker" };

export default async function RunningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auditId = parseInt(id, 10);
  if (!Number.isFinite(auditId) || auditId <= 0) notFound();

  return <ProgressScreen auditId={auditId} />;
}
