// import React from "react";

import { PropsWithChildren } from 'react';
import ReactDOM from 'react-dom/client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

import App from './modules/core/App';

import './index.css';

const VITE_POSTHOG_KEY = "phc_hPZOabiIQet1rsxRGAELYmKy8eByxgklujcj3rTz4cd";
const VITE_POSTHOG_HOST = "https://eu.posthog.com";

const PostHogProviderWrapper = ({ children }: PropsWithChildren) => {
  if (window.location.host === '0l.fyi') {
    posthog.init(VITE_POSTHOG_KEY, {
      api_host: VITE_POSTHOG_HOST,
    });

    return (
      <PostHogProvider
        apiKey={VITE_POSTHOG_KEY}
        options={{ api_host: VITE_POSTHOG_HOST }}
        client={posthog}
      >
        {children}
      </PostHogProvider>
    );
  }
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <PostHogProviderWrapper>
    <App />
  </PostHogProviderWrapper>,
  // </React.StrictMode>
);
