import { prisma } from "@/lib/prisma";
import {
  buildNotificationMessage,
  buildTruckMatches,
  demoOffers,
  demoSettings,
  demoTrucks,
  summarizeAnalytics,
} from "@/lib/freight";

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

  const trucksWithMatches = buildTruckMatches(trucks, offers, settings);
  const analytics = summarizeAnalytics(trucksWithMatches, notifications);

  return {
    settings,
    offers,
    trucks: trucksWithMatches,
    notifications,
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
  await prisma.cargoOffer.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.settings.deleteMany();
  await ensureDemoData();
}

export async function resyncAtiDemo() {
  await prisma.cargoOffer.deleteMany();
  await prisma.cargoOffer.createMany({ data: demoOffers });
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
}

export async function queueTelegramDigest() {
  const data = await getDashboardData();
  const created = [];

  for (const truck of data.trucks.filter((item) => item.matches.length > 0)) {
    created.push(
      prisma.notification.create({
        data: {
          channel: "telegram",
          title: `Подбор для ${truck.code}`,
          message: buildNotificationMessage(truck),
        },
      }),
    );
  }

  await Promise.all(created);
}
