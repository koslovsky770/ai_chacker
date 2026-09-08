import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { adminListLeads } from "@/lib/db";

function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const rows: string[] = [
    ["תאריך", "שם מלא", "אימייל", "אישור שיווקי", "עסק", "אתר", "ציון נראות", "סטטוס בדיקה"]
      .map(csvEscape)
      .join(","),
  ];

  const pageSize = 500;
  let offset = 0;
  for (let page = 0; page < 40; page++) {
    const { items, total } = await adminListLeads({ from, to, limit: pageSize, offset });
    for (const item of items) {
      rows.push(
        [
          item.lead.created_at,
          item.lead.full_name,
          item.lead.email,
          item.lead.marketing_consent ? "כן" : "לא",
          item.business?.business_name ?? "",
          item.business?.website_url ?? "",
          item.audit?.overall_visibility_score ?? "",
          item.audit?.status ?? "",
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    offset += pageSize;
    if (offset >= total || items.length === 0) break;
  }

  const csv = "﻿" + rows.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads.csv"`,
    },
  });
}
