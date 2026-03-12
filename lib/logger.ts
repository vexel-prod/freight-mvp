type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, payload?: Record<string, unknown>) {
  const record = {
    level,
    message,
    ...(payload ? { payload } : {}),
    time: new Date().toISOString(),
  };

  const line = JSON.stringify(record);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}
