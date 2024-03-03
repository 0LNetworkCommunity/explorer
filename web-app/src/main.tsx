// import React from "react";

import ReactDOM from 'react-dom/client';

import App from './modules/core/App';

import './index.css';

const { VITE_POSTHOG_KEY, VITE_POSTHOG_HOST } = import.meta.env;
if (VITE_POSTHOG_KEY && VITE_POSTHOG_HOST) {
  const posthog = require('posthog-js');
  const { PostHogProvider } = require('posthog-js/react');
  posthog.init(VITE_POSTHOG_KEY, {
    api_host: VITE_POSTHOG_HOST,
  });

  ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>,
    // </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode>
    <App />,
    // </React.StrictMode>
  );
}
