// import React from "react";

import { PropsWithChildren } from 'react';
import ReactDOM from 'react-dom/client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

import App from './modules/core/App';

import './index.css';

const { VITE_POSTHOG_KEY, VITE_POSTHOG_HOST } = import.meta.env;

const PostHogProviderWrapper = ({ children }: PropsWithChildren) => {
  if (VITE_POSTHOG_KEY && VITE_POSTHOG_HOST) {
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
