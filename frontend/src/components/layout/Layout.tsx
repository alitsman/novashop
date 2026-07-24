import { Outlet } from "react-router-dom";
import { ToastProvider } from "../common/toast";
import { Header } from "./header";
import "./layout.css";

export function Layout() {
  return (
    <ToastProvider>
      <a className="app-layout__skip-link" href="#main-content">
        Skip to main content
      </a>

      <Header />

      <main className="app-layout__main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </ToastProvider>
  );
}
