import { setTimeout as delay } from "node:timers/promises";

// Render Free stops the backend after 15 minutes without traffic.
// Wake it up before running smoke tests to avoid cold-start timeouts.
const WAKE_UP_DEADLINE_MS = 120_000;
const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 5_000;

export default async function wakeUpDemoBackend(): Promise<void> {
  const healthUrl = new URL("/health", process.env.DEMO_API_URL).toString();
  const deadline = Date.now() + WAKE_UP_DEADLINE_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        return;
      }
    } catch {
      // The backend may still be starting. Retry until the deadline.
    }

    await delay(RETRY_DELAY_MS);
  }

  throw new Error(
    `Demo backend did not respond at ${healthUrl} within ${WAKE_UP_DEADLINE_MS / 1000} seconds.`,
  );
}
