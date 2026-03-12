"use server";

import { revalidatePath } from "next/cache";
import { queueTelegramDigest, resetDemoData, resyncAtiDemo, saveDispatchDecision, updateSettings } from "@/lib/db";

function readNumber(formData: FormData, field: string) {
  const raw = String(formData.get(field) ?? "").trim().replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function readString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export async function syncAtiAction() {
  await resyncAtiDemo();
  revalidatePath("/");
}

export async function resetDemoAction() {
  await resetDemoData();
  revalidatePath("/");
}

export async function sendTelegramDigestAction() {
  await queueTelegramDigest();
  revalidatePath("/");
}

export async function saveSettingsAction(formData: FormData) {
  await updateSettings({
    fuelPriceRub: readNumber(formData, "fuelPriceRub"),
    fuelConsumptionLiters: readNumber(formData, "fuelConsumptionLiters"),
    platonRubPerKm: readNumber(formData, "platonRubPerKm"),
    driverRubPerKm: readNumber(formData, "driverRubPerKm"),
    variableRubPerKm: readNumber(formData, "variableRubPerKm"),
    fixedTripCostsRub: readNumber(formData, "fixedTripCostsRub"),
    targetMarginRub: readNumber(formData, "targetMarginRub"),
    negotiateMarginRub: readNumber(formData, "negotiateMarginRub"),
    takeScoreThreshold: readNumber(formData, "takeScoreThreshold"),
    negotiateScoreThreshold: readNumber(formData, "negotiateScoreThreshold"),
    minTakeRubPerKm: readNumber(formData, "minTakeRubPerKm"),
    minNegotiateRubPerKm: readNumber(formData, "minNegotiateRubPerKm"),
    telegramChatId: readString(formData, "telegramChatId"),
  });

  revalidatePath("/");
}

export async function saveDispatchDecisionAction(formData: FormData) {
  const chosenRateRaw = readString(formData, "chosenRateRub");

  await saveDispatchDecision({
    truckId: readString(formData, "truckId"),
    cargoOfferId: readString(formData, "cargoOfferId"),
    status: readString(formData, "status") as "NEW" | "REVIEW" | "NEGOTIATION" | "APPROVED" | "DECLINED" | "BOOKED" | "IN_PROGRESS" | "COMPLETED",
    logisticName: readString(formData, "logisticName"),
    comment: readString(formData, "comment"),
    chosenRateRub: chosenRateRaw ? readNumber(formData, "chosenRateRub") : null,
  });

  revalidatePath("/");
}
