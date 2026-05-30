import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global API fetch interceptor to route /api requests to Hugging Face Spaces in production
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const targetUrl = cleanBaseUrl ? `${cleanBaseUrl}${input}` : input;
    return originalFetch(targetUrl, init);
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
