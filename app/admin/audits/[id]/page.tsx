import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportView } from "@/components/report/ReportView";
import { isAdminAuthenticated } from "@/lib/auth";
import { DbApiError } from "@/lib/db";
import { loadReportData } from "@/lib/report-data";

export const metadata = { title: "צפייה בדוח | ניהול" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

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

  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <Link href="/admin" className="text-sm text-primary hover:underline">
          → חזרה לרשימת הלידים
        </Link>
      </div>
      <ReportView data={data} showCta={false} />
    </div>
  );
}
