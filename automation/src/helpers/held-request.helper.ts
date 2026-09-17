import type { Page, Route } from "@playwright/test";

const DEFAULT_REQUEST_DEADLINE_MS = 10_000;

type HoldRequestOptions = {
  url: string;
  method: string;
  deadlineMs?: number;
  fulfillWith?: {
    status: number;
    json: unknown;
  };
};

export type HeldRequestController = {
  requestObserved: Promise<void>;
  release: () => void;
  dispose: () => Promise<void>;
};

const createDeferredSignal = () => {
  let resolveSignal: () => void;
  let rejectSignal: (reason: Error) => void;

  const promise = new Promise<void>((resolve, reject) => {
    resolveSignal = resolve;
    rejectSignal = reject;
  });

  return {
    promise,
    resolve: () => resolveSignal(),
    reject: (reason: Error) => rejectSignal(reason),
  };
};

export async function holdRequestUntilReleased(
  page: Page,
  options: HoldRequestOptions,
): Promise<HeldRequestController> {
  const { url, method, deadlineMs = DEFAULT_REQUEST_DEADLINE_MS, fulfillWith } = options;

  const requestObservedSignal = createDeferredSignal();
  const releaseSignal = createDeferredSignal();
  const expectedMethod = method.toUpperCase();

  const activeRequests = new Set<Promise<void>>();

  let deadlineError: Error | null = null;
  let handlerError: Error | null = null;
  let disposePromise: Promise<void> | null = null;

  const completeRequest = async (route: Route): Promise<void> => {
    try {
      await releaseSignal.promise;

      if (fulfillWith) {
        await route.fulfill(fulfillWith);
      } else {
        await route.continue();
      }
    } catch (error) {
      if (handlerError === null) {
        handlerError =
          error instanceof Error ? error : new Error("Failed to complete the held request.");
      }
    }
  };

  const routeHandler = async (route: Route): Promise<void> => {
    if (route.request().method() !== expectedMethod) {
      await route.fallback();

      return;
    }

    requestObservedSignal.resolve();

    const requestCompletion = completeRequest(route);

    activeRequests.add(requestCompletion);

    try {
      await requestCompletion;
    } finally {
      activeRequests.delete(requestCompletion);
    }
  };

  await page.route(url, routeHandler);

  const deadlineTimer = setTimeout(() => {
    deadlineError = new Error(
      `Held request was not released within ${deadlineMs} ms: ${expectedMethod} ${url}`,
    );

    requestObservedSignal.reject(deadlineError);
    releaseSignal.resolve();
  }, deadlineMs);

  const release = (): void => {
    clearTimeout(deadlineTimer);
    releaseSignal.resolve();
  };

  const performDispose = async (): Promise<void> => {
    release();

    await Promise.all(activeRequests);

    let unrouteError: Error | null = null;

    try {
      await page.unroute(url, routeHandler);
    } catch (error) {
      unrouteError =
        error instanceof Error ? error : new Error("Failed to remove the held request route.");
    }

    if (deadlineError) {
      throw deadlineError;
    }

    if (handlerError) {
      throw handlerError;
    }

    if (unrouteError) {
      throw unrouteError;
    }
  };

  const dispose = (): Promise<void> => {
    if (disposePromise === null) {
      disposePromise = performDispose();
    }

    return disposePromise;
  };

  return {
    requestObserved: requestObservedSignal.promise,
    release,
    dispose,
  };
}
