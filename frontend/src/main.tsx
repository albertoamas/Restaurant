import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { queryClient } from './lib/query-client';
import { initPwaInstall } from './utils/pwa-install';
import { PwaUpdatePrompt } from './components/pwa/PwaUpdatePrompt';
import { OfflineBanner } from './components/pwa/OfflineBanner';
import { IosInstallHelp } from './components/pwa/InstallAppMenuItem';
import './styles/index.css';

// Antes del primer render: `beforeinstallprompt` puede dispararse antes de que monte el menú.
initPwaInstall();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <OfflineBanner />
        <PwaUpdatePrompt />
        <IosInstallHelp />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
