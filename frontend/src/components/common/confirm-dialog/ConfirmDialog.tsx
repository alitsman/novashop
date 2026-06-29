import { type SyntheticEvent, useEffect, useId, useRef } from "react";
import { Button, ButtonVariant } from "../button";
import "./confirm-dialog.css";

export type ConfirmDialogVariant = "default" | "danger";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const descriptionId = useId();

  const confirmButtonVariant =
    variant === "danger" ? ButtonVariant.Danger : ButtonVariant.Primary;

  useEffect(() => {
    const dialogElement = dialogRef.current;

    if (!dialogElement) {
      return;
    }

    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        previouslyFocusedElementRef.current = document.activeElement;
      }

      if (!dialogElement.open) {
        dialogElement.showModal();
      }

      cancelButtonRef.current?.focus();

      return;
    }

    if (dialogElement.open) {
      dialogElement.close();
    }

    const previouslyFocusedElement = previouslyFocusedElementRef.current;

    if (
      previouslyFocusedElement &&
      document.contains(previouslyFocusedElement)
    ) {
      previouslyFocusedElement.focus();
    }

    previouslyFocusedElementRef.current = null;
  }, [isOpen]);

  const handleNativeCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onCancel();
  };

  return (
    <dialog
      className="confirm-dialog"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleNativeCancel}
    >
      <div className="confirm-dialog__content">
        <h2 className="confirm-dialog__title" id={titleId}>
          {title}
        </h2>

        <p className="confirm-dialog__description" id={descriptionId}>
          {description}
        </p>

        <div className="confirm-dialog__actions">
          <Button
            className="confirm-dialog__button"
            variant={ButtonVariant.Secondary}
            ref={cancelButtonRef}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            className="confirm-dialog__button"
            variant={confirmButtonVariant}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
