const parseApiUrl = (value: string | undefined): string => {
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

  return apiUrl.toString().replace(/\/$/, "");
};

export const env = {
  apiUrl: parseApiUrl(import.meta.env.VITE_API_URL),
};
