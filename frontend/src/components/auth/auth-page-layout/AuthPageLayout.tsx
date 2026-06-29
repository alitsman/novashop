import type { ReactNode } from "react";
import "./auth-page-layout.css";

type AuthPageLayoutProps = {
  titleId: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPageLayout({
  titleId,
  title,
  description,
  children,
  footer,
}: AuthPageLayoutProps) {
  return (
    <section className="auth-page-layout" aria-labelledby={titleId}>
      <div className="auth-page-layout__card">
        <div className="auth-page-layout__header">
          <h1 className="auth-page-layout__title" id={titleId}>
            {title}
          </h1>

          <p className="auth-page-layout__description">{description}</p>
        </div>

        {children}

        {footer && <div className="auth-page-layout__footer">{footer}</div>}
      </div>
    </section>
  );
}
