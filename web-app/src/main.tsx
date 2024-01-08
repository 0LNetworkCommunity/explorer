import React from "react";
import ReactDOM from "react-dom/client";
import App from "./modules/core/App";
import { PostHogProvider } from "posthog-js/react";
import "./index.css";

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={process.env.REACT_APP_PUBLIC_POSTHOG_KEY}
      options={options}
    >
      <App />
    </PostHogProvider>
  </React.StrictMode>
);
