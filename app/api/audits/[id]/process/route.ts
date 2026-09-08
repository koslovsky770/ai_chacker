import { NextRequest, NextResponse } from "next/server";
import { processAuditTick } from "@/lib/audit-runner";
import { DbApiError } from "@/lib/db";

// Each tick only processes PROCESS_BATCH_SIZE checks, but raise the cap
// above Vercel's default 10s anyway in case a provider call is slow. Hobby
// plans allow up to 60s; Pro/Enterprise can go higher if PROCESS_BATCH_SIZE
// is increased. See README "Architecture".
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auditId = parseInt(id, 10);
  if (!Number.isFinite(auditId) || auditId <= 0) {
    return NextResponse.json({ error: "מזהה בדיקה לא תקין" }, { status: 400 });
  }

  try {
    const progress = await processAuditTick(auditId);
    return NextResponse.json(progress);
  } catch (err) {
    const message = err instanceof DbApiError ? err.message : "שגיאה בעיבוד הבדיקה";
    const status = err instanceof DbApiError && err.status === 404 ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
