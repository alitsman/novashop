import type { ComponentPropsWithRef } from "react";
import { ButtonVariant } from "./buttonTypes";
import "./button.css";

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = ButtonVariant.Primary,
  className,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  const buttonClassName = className
    ? `button button--${variant} ${className}`
    : `button button--${variant}`;

  return <button className={buttonClassName} type={type} {...buttonProps} />;
}
