import { prisma } from "@/lib/prisma";
import { getCargoSourceMode, isTelegramConfigured } from "@/lib/env";
import {
  buildNotificationMessage,
  buildTruckMatches,
  demoOffers,
  demoSettings,
  demoTrucks,
  summarizeAnalytics,
} from "@/lib/freight";
import { fetchAtiOffers, normalizeManualOffers, sendTelegramMessage } from "@/lib/integrations";
import { log } from "@/lib/logger";

async function createAuditEvent(input: {
  level?: "INFO" | "WARN" | "ERROR";
  action: string;
  source: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  await prisma.auditEvent.create({
    data: {
      level: input.level ?? "INFO",
      action: input.action,
      source: input.source,
      message: input.message,
      payloadJson: input.payload ? JSON.stringify(input.payload) : null,
    },
  });
}

export async function ensureDemoData() {
  const [truckCount, offerCount, settings] = await Promise.all([
    prisma.truck.count(),
    prisma.cargoOffer.count(),
    prisma.settings.findUnique({ where: { id: "main" } }),
  ]);

  if (!settings) {
    await prisma.settings.create({ data: demoSettings });
  }

  if (truckCount === 0) {
    await prisma.truck.createMany({ data: demoTrucks });
  }

  if (offerCount === 0) {
    await prisma.cargoOffer.createMany({ data: demoOffers });
  }
}

export async function getDashboardData() {
  await ensureDemoData();

  const [trucks, offers, settings, notifications] = await Promise.all([
    prisma.truck.findMany({ orderBy: [{ status: "asc" }, { city: "asc" }] }),
    prisma.cargoOffer.findMany({ orderBy: [{ loadDate: "asc" }, { rateRub: "desc" }] }),
    prisma.settings.findUniqueOrThrow({ where: { id: "main" } }),
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const auditEvents = await prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 8 });

  const trucksWithMatches = buildTruckMatches(trucks, offers, settings);
  const analytics = summarizeAnalytics(trucksWithMatches, notifications);

  return {
    settings,
    offers,
    trucks: trucksWithMatches,
    notifications,
    auditEvents,
    sourceMode: getCargoSourceMode(),
    analytics,
    topOffers: trucksWithMatches.flatMap((truck) =>
      truck.matches.slice(0, 2).map((match) => ({
        truckCode: truck.code,
        truckCity: truck.city,
        offer: match.offer,
        economics: match.economics,
      })),
    ).sort((left, right) => right.economics.score - left.economics.score),
  };
}

export async function resetDemoData() {
  await prisma.notification.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.cargoOffer.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.settings.deleteMany();
  await ensureDemoData();
  await createAuditEvent({
    action: "reset_demo_data",
    source: "system",
    message: "Demo data was reset",
  });
}

export async function resyncAtiDemo() {
  const result = await fetchAtiOffers();
  await prisma.cargoOffer.deleteMany();

  if (result.offers.length > 0) {
    await prisma.cargoOffer.createMany({ data: result.offers });
  }

  await createAuditEvent({
    action: "sync_offers",
    source: result.source,
    message: `Offers synced from ${result.source}`,
    payload: { offers: result.offers.length },
  });

  log("info", "Offers synced", { source: result.source, offers: result.offers.length });

  return result;
}

export async function importManualOffers(input: unknown) {
  const offers = normalizeManualOffers(input);

  await prisma.cargoOffer.deleteMany();
  if (offers.length > 0) {
    await prisma.cargoOffer.createMany({ data: offers });
  }

  await createAuditEvent({
    action: "manual_import_offers",
    source: "manual",
    message: "Offers imported manually",
    payload: { offers: offers.length },
  });

  return { imported: offers.length };
}

export async function updateSettings(input: {
  fuelPriceRub: number;
  fuelConsumptionLiters: number;
  platonRubPerKm: number;
  driverRubPerKm: number;
  variableRubPerKm: number;
  fixedTripCostsRub: number;
  targetMarginRub: number;
  negotiateMarginRub: number;
  takeScoreThreshold: number;
  negotiateScoreThreshold: number;
  minTakeRubPerKm: number;
  minNegotiateRubPerKm: number;
  telegramChatId: string;
}) {
  await prisma.settings.update({
    where: { id: "main" },
    data: input,
  });

  await createAuditEvent({
    action: "update_settings",
    source: "panel",
    message: "Settings updated",
    payload: {
      fuelPriceRub: input.fuelPriceRub,
      targetMarginRub: input.targetMarginRub,
      telegramChatId: input.telegramChatId,
    },
  });
}

export async function queueTelegramDigest() {
  const data = await getDashboardData();
  const created = [];

  for (const truck of data.trucks.filter((item) => item.matches.length > 0)) {
    const message = buildNotificationMessage(truck);
    const delivery = await sendTelegramMessage(message);

    created.push(
      prisma.notification.create({
        data: {
          channel: "telegram",
          title: `Подбор для ${truck.code}`,
          message,
          status: delivery.sent ? "SENT" : "PENDING",
        },
      }),
    );
  }

  await Promise.all(created);

  await createAuditEvent({
    level: isTelegramConfigured() ? "INFO" : "WARN",
    action: "telegram_digest",
    source: "telegram",
    message: isTelegramConfigured() ? "Telegram digest sent" : "Telegram digest queued without external delivery",
    payload: {
      notificationsCreated: created.length,
      telegramConfigured: isTelegramConfigured(),
    },
  });

  return {
    notificationsCreated: created.length,
    telegramConfigured: isTelegramConfigured(),
  };
}
