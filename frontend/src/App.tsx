import { useAppBootstrap } from "./app/useAppBootstrap";
import { AppBootstrapScreen } from "./components/layout/app-bootstrap-screen";
import { AppRouter } from "./routes/AppRouter";

function App() {
  const isAppBootstrapped = useAppBootstrap();

  if (!isAppBootstrapped) {
    return <AppBootstrapScreen />;
  }

  return <AppRouter />;
}

export default App;
