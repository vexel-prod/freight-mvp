export async function fetchJsonWithRetry<T>(input: string, init: RequestInit & { timeoutMs?: number; retries?: number }) {
  const retries = init.retries ?? 0;
  const timeoutMs = init.timeoutMs ?? 10000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.json() as T;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}
