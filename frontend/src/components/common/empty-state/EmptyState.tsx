import type { ReactNode } from "react";
import "./empty-state.css";

type EmptyStateProps = {
  imageSrc: string;
  title: string;
  description: string;
  imageAlt?: string;
  children?: ReactNode;
};

export function EmptyState({
  imageSrc,
  imageAlt = "",
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <img
        className="empty-state__image"
        src={imageSrc}
        alt={imageAlt}
        aria-hidden={imageAlt === "" ? true : undefined}
      />

      <div className="empty-state__content">
        <h2 className="empty-state__title">{title}</h2>

        <p className="empty-state__description">{description}</p>
      </div>

      {children && <div className="empty-state__action">{children}</div>}
    </div>
  );
}
