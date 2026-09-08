import { NextRequest, NextResponse } from "next/server";
import { setAdminSession, verifyAdminSecret } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  if (!body.secret || typeof body.secret !== "string" || !verifyAdminSecret(body.secret)) {
    return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
