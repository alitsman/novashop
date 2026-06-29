import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ToastContext } from "./ToastContext";
import { ToastViewport, type ToastViewModel } from "./ToastViewport";

const TOAST_DURATION_MS = 4000;

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastViewModel | null>(null);
  const nextToastIdRef = useRef(0);

  const showToast = useCallback((message: string) => {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    nextToastIdRef.current += 1;

    setToast({
      id: nextToastIdRef.current,
      message: normalizedMessage,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const toastId = toast?.id;

  useEffect(() => {
    if (toastId === undefined) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((currentToast) => {
        return currentToast?.id === toastId ? null : currentToast;
      });
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastId]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      <ToastViewport toast={toast} onClose={hideToast} />
    </ToastContext.Provider>
  );
}
