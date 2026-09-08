import { notFound } from "next/navigation";
import { ReportView } from "@/components/report/ReportView";
import { DbApiError } from "@/lib/db";
import { loadReportData } from "@/lib/report-data";

export const metadata = { title: "דוח נראות AI | AI Visibility Checker" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auditId = parseInt(id, 10);
  if (!Number.isFinite(auditId) || auditId <= 0) notFound();

  let data;
  try {
    data = await loadReportData(auditId);
  } catch (err) {
    if (err instanceof DbApiError && err.status === 404) notFound();
    throw err;
  }

  return <ReportView data={data} />;
}
