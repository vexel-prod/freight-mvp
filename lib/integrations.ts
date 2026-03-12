import { appEnv, getCargoSourceMode, isAtiConfigured, isTelegramConfigured } from "@/lib/env";
import { demoOffers } from "@/lib/freight";
import { log } from "@/lib/logger";
import { fetchJsonWithRetry } from "@/lib/net";

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
  const mode = getCargoSourceMode();

  if (mode === "demo" || !isAtiConfigured()) {
    return {
      source: "demo" as const,
      offers: demoOffers,
    };
  }

  const payload = await fetchJsonWithRetry<unknown>(appEnv.atiApiUrl!, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(appEnv.atiApiToken ? { Authorization: `Bearer ${appEnv.atiApiToken}` } : {}),
      ...(appEnv.atiApiKey ? { "X-API-Key": appEnv.atiApiKey } : {}),
    },
    cache: "no-store",
    timeoutMs: appEnv.atiRequestTimeoutMs,
    retries: appEnv.atiMaxRetries,
  });

  const payloadRecord = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  const payloadItems = payloadRecord?.items;
  const payloadData = payloadRecord?.data;

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payloadItems)
      ? payloadItems
      : Array.isArray(payloadData)
        ? payloadData
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

  await fetchJsonWithRetry(`https://api.telegram.org/bot${appEnv.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: appEnv.telegramChatId,
      text,
    }),
    timeoutMs: appEnv.telegramRequestTimeoutMs,
    retries: 1,
  });

  return {
    sent: true,
    reason: null,
  };
}

export function normalizeManualOffers(input: unknown) {
  const items = Array.isArray(input)
    ? input
    : Array.isArray((input as { offers?: unknown[] })?.offers)
      ? (input as { offers: unknown[] }).offers
      : [];

  const offers = items
    .map((item, index) => normalizeAtiOffer(item as AtiOfferPayload, index))
    .filter((item: ReturnType<typeof normalizeAtiOffer>): item is NonNullable<ReturnType<typeof normalizeAtiOffer>> => Boolean(item));

  log("info", "Manual offers normalized", { count: offers.length });
  return offers;
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
