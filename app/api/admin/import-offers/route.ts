import { NextRequest, NextResponse } from "next/server";
import { importManualOffers } from "@/lib/db";
import { assertAdminToken } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!assertAdminToken(request.headers.get("x-admin-token"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const result = await importManualOffers(payload);

  return NextResponse.json({
    ok: true,
    action: "import-offers",
    imported: result.imported,
    time: new Date().toISOString(),
  });
}
