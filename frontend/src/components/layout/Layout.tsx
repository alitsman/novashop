import { Outlet } from "react-router-dom";
import { ToastProvider } from "../common/toast";
import { Header } from "./header";
import "./layout.css";

export function Layout() {
  return (
    <ToastProvider>
      <Header />

      <main className="app-layout__main">
        <Outlet />
      </main>
    </ToastProvider>
  );
}
