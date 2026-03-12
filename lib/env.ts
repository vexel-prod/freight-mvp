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
  atiApiUrl: readEnv("ATI_API_URL"),
  atiApiToken: readEnv("ATI_API_TOKEN"),
  atiApiKey: readEnv("ATI_API_KEY"),
  telegramBotToken: readEnv("TELEGRAM_BOT_TOKEN"),
  telegramChatId: readEnv("TELEGRAM_CHAT_ID"),
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
