import "./loader.css";

type LoaderProps = {
  message: string;
  className?: string;
};

export function Loader({ message, className }: LoaderProps) {
  const loaderClassName = className ? `loader ${className}` : "loader";

  return (
    <div className={loaderClassName} role="status" aria-live="polite">
      <span className="loader__spinner" aria-hidden="true" />
      <span className="loader__message">{message}</span>
    </div>
  );
}
