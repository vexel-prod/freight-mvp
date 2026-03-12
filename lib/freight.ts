import type { CargoOffer, Notification, RecommendationKind, Settings, Truck } from "@prisma/client";

export type MatchEconomics = {
  totalDistanceKm: number;
  fuelRub: number;
  platonRub: number;
  driverRub: number;
  variableRub: number;
  fixedRub: number;
  totalCostsRub: number;
  rateWithSurchargeRub: number;
  marginRub: number;
  rubPerKm: number;
  score: number;
  recommendation: RecommendationKind;
  recommendationLabel: string;
};

export type TruckWithMatches = Truck & {
  matches: Array<{
    offer: CargoOffer;
    economics: MatchEconomics;
  }>;
};

export function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function computeEconomics(settings: Settings, offer: CargoOffer): MatchEconomics {
  const totalDistanceKm = offer.distanceKm + offer.extraEmptyRunKm;
  const fuelRub = totalDistanceKm * (settings.fuelConsumptionLiters / 100) * settings.fuelPriceRub;
  const platonRub = offer.distanceKm * settings.platonRubPerKm;
  const driverRub = offer.distanceKm * settings.driverRubPerKm;
  const variableRub = totalDistanceKm * settings.variableRubPerKm;
  const fixedRub = settings.fixedTripCostsRub;
  const totalCostsRub = fuelRub + platonRub + driverRub + variableRub + fixedRub;
  const rateWithSurchargeRub = offer.rateRub + offer.fuelSurchargeRub;
  const marginRub = rateWithSurchargeRub - totalCostsRub;
  const rubPerKm = totalDistanceKm > 0 ? rateWithSurchargeRub / totalDistanceKm : 0;

  const marginScore = clamp((marginRub / settings.targetMarginRub) * 45, 0, 45);
  const rubPerKmScore = clamp((rubPerKm / settings.minTakeRubPerKm) * 30, 0, 30);
  const shortEmptyRunPenalty = clamp((offer.extraEmptyRunKm / 300) * 15, 0, 15);
  const bodyBonus = offer.bodyType.toLowerCase() === "тент" ? 5 : 0;
  const score = Math.round(clamp(marginScore + rubPerKmScore + bodyBonus - shortEmptyRunPenalty + 20, 0, 100));

  let recommendation: RecommendationKind = "DECLINE";
  let recommendationLabel = "Не брать";

  if (
    marginRub >= settings.targetMarginRub &&
    rubPerKm >= settings.minTakeRubPerKm &&
    score >= settings.takeScoreThreshold
  ) {
    recommendation = "TAKE";
    recommendationLabel = "Брать";
  } else if (
    marginRub >= settings.negotiateMarginRub &&
    rubPerKm >= settings.minNegotiateRubPerKm &&
    score >= settings.negotiateScoreThreshold
  ) {
    recommendation = "NEGOTIATE";
    recommendationLabel = "Торговаться";
  }

  return {
    totalDistanceKm,
    fuelRub,
    platonRub,
    driverRub,
    variableRub,
    fixedRub,
    totalCostsRub,
    rateWithSurchargeRub,
    marginRub,
    rubPerKm,
    score,
    recommendation,
    recommendationLabel,
  };
}

export function buildTruckMatches(trucks: Truck[], offers: CargoOffer[], settings: Settings): TruckWithMatches[] {
  return trucks.map((truck) => {
    const matches = offers
      .filter((offer) => isMatching(truck, offer))
      .map((offer) => ({ offer, economics: computeEconomics(settings, offer) }))
      .sort((left, right) => right.economics.score - left.economics.score);

    return { ...truck, matches };
  });
}

export function buildNotificationMessage(truck: TruckWithMatches): string {
  const top = truck.matches.slice(0, 3);
  if (top.length === 0) {
    return `${truck.code}: подходящих грузов не найдено.`;
  }

  return [
    `${truck.code} · ${truck.city} · ${truck.bodyType} · ${formatNumber(truck.capacityTons, 1)} т`,
    ...top.map((item, index) => {
      const prefix = `${index + 1}. ${item.offer.sourceCity} -> ${item.offer.destinationCity}`;
      const details = `${formatMoney(item.offer.rateRub)} | маржа ${formatMoney(item.economics.marginRub)} | рейтинг ${item.economics.score}`;
      return `${prefix} | ${details} | ${item.economics.recommendationLabel}`;
    }),
  ].join("\n");
}

export function summarizeAnalytics(trucks: TruckWithMatches[], notifications: Notification[]) {
  const allMatches = trucks.flatMap((truck) => truck.matches);
  const take = allMatches.filter((item) => item.economics.recommendation === "TAKE");
  const negotiate = allMatches.filter((item) => item.economics.recommendation === "NEGOTIATE");
  const decline = allMatches.filter((item) => item.economics.recommendation === "DECLINE");
  const bestMargin = allMatches.reduce((best, item) => Math.max(best, item.economics.marginRub), 0);

  return {
    truckCount: trucks.length,
    freeTruckCount: trucks.filter((truck) => truck.status === "FREE").length,
    offerCount: new Set(allMatches.map((item) => item.offer.id)).size,
    takeCount: take.length,
    negotiateCount: negotiate.length,
    declineCount: decline.length,
    avgScore: allMatches.length
      ? Math.round(allMatches.reduce((sum, item) => sum + item.economics.score, 0) / allMatches.length)
      : 0,
    bestMargin,
    pendingNotifications: notifications.filter((notification) => notification.status === "PENDING").length,
  };
}

export const demoTrucks: Array<Omit<Truck, "id" | "createdAt" | "updatedAt">> = [
  {
    code: "TR-101",
    city: "Воронеж",
    availableFrom: new Date("2026-03-12T08:00:00+03:00"),
    bodyType: "тент",
    capacityTons: 20,
    status: "FREE",
    driverName: "Алексей К.",
    note: "Свободна сегодня",
  },
  {
    code: "TR-118",
    city: "Ростов-на-Дону",
    availableFrom: new Date("2026-03-12T14:00:00+03:00"),
    bodyType: "реф",
    capacityTons: 18,
    status: "FREE",
    driverName: "Иван Г.",
    note: "Под продукты",
  },
  {
    code: "TR-124",
    city: "Москва",
    availableFrom: new Date("2026-03-13T09:00:00+03:00"),
    bodyType: "тент",
    capacityTons: 20,
    status: "ON_ROUTE",
    driverName: "Михаил П.",
    note: "Освобождается завтра",
  },
];

export const demoOffers: Array<Omit<CargoOffer, "id" | "createdAt" | "updatedAt">> = [
  {
    atiId: "ATI-1001",
    sourceSystem: "ATI.SU",
    sourceCity: "Воронеж",
    destinationCity: "Москва",
    loadDate: new Date("2026-03-12T12:00:00+03:00"),
    bodyType: "тент",
    weightTons: 20,
    rateRub: 74000,
    distanceKm: 525,
    extraEmptyRunKm: 18,
    fuelSurchargeRub: 0,
    comment: "Промтовары, без перегруза",
  },
  {
    atiId: "ATI-1002",
    sourceSystem: "ATI.SU",
    sourceCity: "Воронеж",
    destinationCity: "Калуга",
    loadDate: new Date("2026-03-12T16:00:00+03:00"),
    bodyType: "тент",
    weightTons: 20,
    rateRub: 63000,
    distanceKm: 470,
    extraEmptyRunKm: 22,
    fuelSurchargeRub: 0,
    comment: "Стройматериалы",
  },
  {
    atiId: "ATI-1003",
    sourceSystem: "ATI.SU",
    sourceCity: "Воронеж",
    destinationCity: "Рязань",
    loadDate: new Date("2026-03-12T18:00:00+03:00"),
    bodyType: "тент",
    weightTons: 20,
    rateRub: 41000,
    distanceKm: 390,
    extraEmptyRunKm: 10,
    fuelSurchargeRub: 0,
    comment: "Ставка ниже рынка",
  },
  {
    atiId: "ATI-1004",
    sourceSystem: "ATI.SU",
    sourceCity: "Ростов-на-Дону",
    destinationCity: "Краснодар",
    loadDate: new Date("2026-03-12T20:00:00+03:00"),
    bodyType: "реф",
    weightTons: 18,
    rateRub: 52000,
    distanceKm: 285,
    extraEmptyRunKm: 12,
    fuelSurchargeRub: 4000,
    comment: "Молочная продукция",
  },
  {
    atiId: "ATI-1005",
    sourceSystem: "ATI.SU",
    sourceCity: "Ростов-на-Дону",
    destinationCity: "Самара",
    loadDate: new Date("2026-03-13T09:00:00+03:00"),
    bodyType: "реф",
    weightTons: 17,
    rateRub: 96000,
    distanceKm: 1170,
    extraEmptyRunKm: 0,
    fuelSurchargeRub: 5000,
    comment: "Овощи, срочная загрузка",
  },
  {
    atiId: "ATI-1006",
    sourceSystem: "ATI.SU",
    sourceCity: "Москва",
    destinationCity: "Санкт-Петербург",
    loadDate: new Date("2026-03-13T12:00:00+03:00"),
    bodyType: "тент",
    weightTons: 20,
    rateRub: 88000,
    distanceKm: 710,
    extraEmptyRunKm: 15,
    fuelSurchargeRub: 0,
    comment: "FMCG",
  },
];

export const demoSettings: Omit<Settings, "updatedAt"> = {
  id: "main",
  companyName: "Внутренний подбор грузов",
  fuelPriceRub: 68,
  fuelConsumptionLiters: 31,
  platonRubPerKm: 3.05,
  driverRubPerKm: 10.5,
  variableRubPerKm: 6.4,
  fixedTripCostsRub: 4500,
  targetMarginRub: 20000,
  negotiateMarginRub: 8000,
  takeScoreThreshold: 80,
  negotiateScoreThreshold: 55,
  minTakeRubPerKm: 125,
  minNegotiateRubPerKm: 100,
  telegramChatId: "@logists_demo",
};

function isMatching(truck: Truck, offer: CargoOffer) {
  if (truck.status !== "FREE") return false;
  if (truck.city.toLowerCase() !== offer.sourceCity.toLowerCase()) return false;
  if (truck.bodyType.toLowerCase() !== offer.bodyType.toLowerCase()) return false;
  if (truck.capacityTons < offer.weightTons) return false;
  return truck.availableFrom <= offer.loadDate;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
