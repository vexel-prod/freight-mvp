import { appEnv, isAtiConfigured, isTelegramConfigured } from "@/lib/env";
import { demoOffers } from "@/lib/freight";

type AtiOfferPayload = {
  atiId?: string | number;
  sourceCity?: string;
  destinationCity?: string;
  loadDate?: string;
  bodyType?: string;
  weightTons?: number | string;
  rateRub?: number | string;
  distanceKm?: number | string;
  extraEmptyRunKm?: number | string;
  fuelSurchargeRub?: number | string;
  comment?: string;
};

export async function fetchAtiOffers() {
  if (!isAtiConfigured()) {
    return {
      source: "demo" as const,
      offers: demoOffers,
    };
  }

  const response = await fetch(appEnv.atiApiUrl!, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(appEnv.atiApiToken ? { Authorization: `Bearer ${appEnv.atiApiToken}` } : {}),
      ...(appEnv.atiApiKey ? { "X-API-Key": appEnv.atiApiKey } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ATI request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  const offers = items
    .map((item: AtiOfferPayload, index: number) => normalizeAtiOffer(item, index))
    .filter((item: ReturnType<typeof normalizeAtiOffer>): item is NonNullable<ReturnType<typeof normalizeAtiOffer>> => Boolean(item));

  return {
    source: "ati" as const,
    offers,
  };
}

export async function sendTelegramMessage(text: string) {
  if (!isTelegramConfigured()) {
    return {
      sent: false,
      reason: "telegram_not_configured" as const,
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${appEnv.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: appEnv.telegramChatId,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram request failed with status ${response.status}`);
  }

  return {
    sent: true,
    reason: null,
  };
}

function normalizeAtiOffer(raw: AtiOfferPayload, index: number) {
  const atiId = String(raw.atiId ?? `ATI-LIVE-${index + 1}`).trim();
  const sourceCity = String(raw.sourceCity ?? "").trim();
  const destinationCity = String(raw.destinationCity ?? "").trim();
  const loadDateRaw = String(raw.loadDate ?? "").trim();
  const bodyType = String(raw.bodyType ?? "").trim();
  const weightTons = Number(raw.weightTons ?? 0);
  const rateRub = Number(raw.rateRub ?? 0);
  const distanceKm = Number(raw.distanceKm ?? 0);

  if (!atiId || !sourceCity || !destinationCity || !loadDateRaw || !bodyType) return null;
  if (!Number.isFinite(weightTons) || !Number.isFinite(rateRub) || !Number.isFinite(distanceKm)) return null;

  const loadDate = new Date(loadDateRaw);
  if (Number.isNaN(loadDate.getTime())) return null;

  return {
    atiId,
    sourceSystem: "ATI.SU",
    sourceCity,
    destinationCity,
    loadDate,
    bodyType,
    weightTons,
    rateRub,
    distanceKm,
    extraEmptyRunKm: Number(raw.extraEmptyRunKm ?? 0) || 0,
    fuelSurchargeRub: Number(raw.fuelSurchargeRub ?? 0) || 0,
    comment: raw.comment?.trim() || null,
  };
}
