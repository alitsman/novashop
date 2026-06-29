const DEFAULT_DELAY_MS = 300;

export function delay(delayMs = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
