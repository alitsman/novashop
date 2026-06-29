import { CrossIcon } from "../cross-icon";
import "./toast.css";

export type ToastViewModel = {
  id: number;
  message: string;
};

type ToastViewportProps = {
  toast: ToastViewModel | null;
  onClose: () => void;
};

export function ToastViewport({ toast, onClose }: ToastViewportProps) {
  const className = toast
    ? "toast-viewport toast-viewport--visible"
    : "toast-viewport";

  return (
    <div className={className}>
      <div
        className="toast-viewport__message"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && <span key={toast.id}>{toast.message}</span>}
      </div>

      {toast && (
        <button
          className="toast-viewport__close-button"
          type="button"
          aria-label="Close notification"
          onClick={onClose}
        >
          <CrossIcon />
        </button>
      )}
    </div>
  );
}
