import React from "react";
import ReactDOM from "react-dom/client";
import App from "./modules/core/App";
import posthog from 'posthog-js';
import { PostHogProvider } from "posthog-js/react";
import "./index.css";

posthog.init(
  import.meta.env.VITE_POSTHOG_KEY,
  {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
  }
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </React.StrictMode>
);
