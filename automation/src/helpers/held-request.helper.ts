import type { Page, Route } from "@playwright/test";

const DEFAULT_REQUEST_DEADLINE_MS = 10_000;

type HeldRequestFulfillment = {
  status: number;
  json: unknown;
};

type HoldRequestOptions = {
  url: string;
  method: string;
  deadlineMs?: number;
  fulfillWith?: HeldRequestFulfillment;
};

export type HeldRequestController = {
  requestObserved: Promise<void>;
  release: () => void;
  dispose: () => Promise<void>;
};

type DeferredSignal = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason: Error) => void;
};

const createDeferredSignal = (): DeferredSignal => {
  let resolveSignal: (() => void) | undefined;
  let rejectSignal: ((reason: Error) => void) | undefined;

  const promise = new Promise<void>((resolve, reject) => {
    resolveSignal = () => resolve();
    rejectSignal = (reason) => reject(reason);
  });

  return {
    promise,
    resolve: () => resolveSignal?.(),
    reject: (reason) => rejectSignal?.(reason),
  };
};

const normalizeError = (error: unknown, fallbackMessage: string): Error => {
  return error instanceof Error ? error : new Error(fallbackMessage);
};

export async function holdRequestUntilReleased(
  page: Page,
  { url, method, deadlineMs = DEFAULT_REQUEST_DEADLINE_MS, fulfillWith }: HoldRequestOptions,
): Promise<HeldRequestController> {
  const requestObservedSignal = createDeferredSignal();
  const releaseSignal = createDeferredSignal();
  const expectedMethod = method.toUpperCase();

  const activeHandlerCompletions = new Set<Promise<void>>();
  const handlerErrors: Error[] = [];

  let isReleased = false;
  let deadlineError: Error | null = null;
  let disposePromise: Promise<void> | null = null;

  const release = (): void => {
    if (isReleased) {
      return;
    }

    isReleased = true;
    releaseSignal.resolve();
  };

  const routeHandler = async (route: Route): Promise<void> => {
    if (route.request().method() !== expectedMethod) {
      await route.fallback();

      return;
    }

    requestObservedSignal.resolve();

    const handlerCompletion = (async () => {
      try {
        await releaseSignal.promise;

        if (fulfillWith) {
          await route.fulfill({
            status: fulfillWith.status,
            json: fulfillWith.json,
          });
        } else {
          await route.continue();
        }
      } catch (error) {
        handlerErrors.push(normalizeError(error, "Failed to complete the held request."));
      }
    })();

    activeHandlerCompletions.add(handlerCompletion);

    try {
      await handlerCompletion;
    } finally {
      activeHandlerCompletions.delete(handlerCompletion);
    }
  };

  await page.route(url, routeHandler);

  const deadlineTimer = setTimeout(() => {
    deadlineError = new Error(
      `Held request was not released within ${deadlineMs} ms: ${expectedMethod} ${url}`,
    );

    requestObservedSignal.reject(deadlineError);
    release();
  }, deadlineMs);

  const dispose = (): Promise<void> => {
    if (disposePromise) {
      return disposePromise;
    }

    disposePromise = (async () => {
      release();
      clearTimeout(deadlineTimer);

      await Promise.all([...activeHandlerCompletions]);

      let unrouteError: Error | null = null;

      try {
        await page.unroute(url, routeHandler);
      } catch (error) {
        unrouteError = normalizeError(error, "Failed to remove the held request route.");
      }

      if (deadlineError) {
        throw deadlineError;
      }

      // Multiple handlers may fail during the same release; the first failure is the root signal.
      const handlerError = handlerErrors[0];

      if (handlerError) {
        throw handlerError;
      }

      if (unrouteError) {
        throw unrouteError;
      }
    })();

    return disposePromise;
  };

  return {
    requestObserved: requestObservedSignal.promise,
    release,
    dispose,
  };
}
