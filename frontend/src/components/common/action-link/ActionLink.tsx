import { Link, type LinkProps } from "react-router-dom";
import "./action-link.css";

type ActionLinkProps = LinkProps;

export function ActionLink({ className, ...linkProps }: ActionLinkProps) {
  const actionLinkClassName = className
    ? `action-link ${className}`
    : "action-link";

  return <Link className={actionLinkClassName} {...linkProps} />;
}
