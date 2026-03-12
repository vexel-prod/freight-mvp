import { NextRequest, NextResponse } from "next/server";
import { resetDemoData } from "@/lib/db";
import { assertAdminToken } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!assertAdminToken(request.headers.get("x-admin-token"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await resetDemoData();

  return NextResponse.json({
    ok: true,
    action: "reset",
    time: new Date().toISOString(),
  });
}
