import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCargoSourceMode, isAtiConfigured, isPanelAuthEnabled, isTelegramConfigured } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      service: "freight-mvp",
      time: new Date().toISOString(),
      integrations: {
        db: "up",
        ati: isAtiConfigured() ? "configured" : "demo",
        telegram: isTelegramConfigured() ? "configured" : "disabled",
        panelAuth: isPanelAuthEnabled() ? "enabled" : "disabled",
        cargoSourceMode: getCargoSourceMode(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "freight-mvp",
        time: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown healthcheck error",
      },
      { status: 503 },
    );
  }
}
