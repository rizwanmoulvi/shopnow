import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import liff from '@line/liff'

const renderApp = () => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// Check if we have a valid LIFF ID and we're in a LIFF environment
const LIFF_ID = import.meta.env.VITE_LIFF_ID || '2008002087-6oJNrWNP';
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (LIFF_ID && LIFF_ID !== 'YOUR_LIFF_ID' && !isDevelopment) {
  // Try to initialize LIFF only in production
  liff.init({ liffId: LIFF_ID })
    .then(() => {
      console.log('LIFF initialized successfully');
      renderApp();
    })
    .catch((error) => {
      console.warn('LIFF initialization failed, running in standalone mode:', error);
      renderApp();
    });
} else {
  // Run in development/standalone mode without LIFF
  console.log(isDevelopment ? 'Running in development mode without LIFF' : 'Running in standalone mode without LIFF');
  renderApp();
}
