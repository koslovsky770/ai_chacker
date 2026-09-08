import { NextRequest, NextResponse } from "next/server";
import { createLead, DbApiError } from "@/lib/db";
import { leadSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו JSON תקין" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const lead = await createLead(parsed.data);
    return NextResponse.json({ lead });
  } catch (err) {
    const message = err instanceof DbApiError ? err.message : "שגיאה בשמירת הפרטים";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
