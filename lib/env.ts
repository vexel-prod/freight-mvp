function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const appEnv = {
  databaseUrl: readEnv("DATABASE_URL"),
  directUrl: readEnv("DIRECT_URL"),
  adminToken: readEnv("ADMIN_API_TOKEN"),
  panelUsername: readEnv("PANEL_USERNAME"),
  panelPassword: readEnv("PANEL_PASSWORD"),
  cargoSourceMode: readEnv("CARGO_SOURCE_MODE") ?? "demo",
  atiApiUrl: readEnv("ATI_API_URL"),
  atiApiToken: readEnv("ATI_API_TOKEN"),
  atiApiKey: readEnv("ATI_API_KEY"),
  atiRequestTimeoutMs: Number(readEnv("ATI_REQUEST_TIMEOUT_MS") ?? "12000"),
  atiMaxRetries: Number(readEnv("ATI_MAX_RETRIES") ?? "2"),
  telegramBotToken: readEnv("TELEGRAM_BOT_TOKEN"),
  telegramChatId: readEnv("TELEGRAM_CHAT_ID"),
  telegramRequestTimeoutMs: Number(readEnv("TELEGRAM_REQUEST_TIMEOUT_MS") ?? "10000"),
};

export function isPanelAuthEnabled() {
  return Boolean(appEnv.panelUsername && appEnv.panelPassword);
}

export function isAtiConfigured() {
  return Boolean(appEnv.atiApiUrl && (appEnv.atiApiToken || appEnv.atiApiKey));
}

export function isTelegramConfigured() {
  return Boolean(appEnv.telegramBotToken && appEnv.telegramChatId);
}

export function assertAdminToken(token: string | null) {
  return Boolean(appEnv.adminToken && token && token === appEnv.adminToken);
}

export function getCargoSourceMode() {
  if (appEnv.cargoSourceMode === "ati" || appEnv.cargoSourceMode === "manual" || appEnv.cargoSourceMode === "demo") {
    return appEnv.cargoSourceMode;
  }

  return "demo";
}
