import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initI18n } from "./lib/i18n";
import { SWRConfig } from "swr";
import { fetcher } from "./lib/fetcher";
import App from "./App";

const init = async () => {
  // Initialize i18n before rendering
  await initI18n();
  
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <SWRConfig value={{ fetcher }}>
        <App />
      </SWRConfig>
    </StrictMode>
  );
};

init().catch(console.error);