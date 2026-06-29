import { useContext } from "react";
import { ToastContext, type ShowToast } from "./ToastContext";

export function useToast(): ShowToast {
  const showToast = useContext(ToastContext);

  if (!showToast) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return showToast;
}
