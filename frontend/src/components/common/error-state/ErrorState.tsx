import type { ReactNode } from "react";
import errorImage from "../../../assets/error.png";
import "./error-state.css";

type ErrorStateProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function ErrorState({ title, description, children }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <img
        className="error-state__image"
        src={errorImage}
        alt=""
        aria-hidden="true"
      />

      <div className="error-state__content">
        <h2 className="error-state__title">{title}</h2>

        <p className="error-state__description">{description}</p>
      </div>

      {children && <div className="error-state__action">{children}</div>}
    </div>
  );
}
