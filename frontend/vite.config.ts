import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const validateApiUrl = (value: string | undefined): void => {
  if (!value) {
    throw new Error("VITE_API_URL is required.");
  }

  let apiUrl: URL;

  try {
    apiUrl = new URL(value);
  } catch {
    throw new Error("VITE_API_URL must be a valid absolute URL.");
  }

  if (apiUrl.protocol !== "http:" && apiUrl.protocol !== "https:") {
    throw new Error("VITE_API_URL must use HTTP or HTTPS.");
  }
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  validateApiUrl(env.VITE_API_URL);

  return {
    plugins: [react()],
  };
});
