import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './context/AuthProvider.tsx';
import { BackendProvider } from './context/BackendProvider.tsx';
import { ConfirmProvider } from './context/ConfirmProvider.tsx';
import { ToastProvider } from './context/ToastProvider.tsx';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element was not found');
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <BackendProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </BackendProvider>
    </BrowserRouter>
  </StrictMode>,
);
