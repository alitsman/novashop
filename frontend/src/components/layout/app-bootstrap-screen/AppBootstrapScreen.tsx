import { Loader } from "../../common/loader";
import { HeaderView } from "../header/HeaderView";
import "./app-bootstrap-screen.css";

export function AppBootstrapScreen() {
  return (
    <div className="app-bootstrap-screen">
      <HeaderView variant="bootstrap" />

      <main className="app-bootstrap-screen__main">
        <Loader message="Restoring session..." />
      </main>
    </div>
  );
}
