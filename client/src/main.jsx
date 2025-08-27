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

// More robust LINE app detection
const isInLineApp = () => {
  const userAgent = navigator.userAgent;
  return (
    userAgent.includes('Line') ||
    window.location.search.includes('liff.state') ||
    window.location.hash.includes('liff.state') ||
    document.referrer.includes('line.me')
  );
};

console.log('Environment check:', {
  LIFF_ID,
  isDevelopment,
  hostname: window.location.hostname,
  isInLineApp: isInLineApp(),
  userAgent: navigator.userAgent,
  search: window.location.search,
  referrer: document.referrer
});

// Only initialize LIFF if we're definitely in the LINE app environment
if (LIFF_ID && LIFF_ID !== 'YOUR_LIFF_ID' && !isDevelopment && isInLineApp()) {
  console.log('Attempting LIFF initialization...');
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
  // Run in standalone mode without LIFF
  const reason = isDevelopment 
    ? 'development mode' 
    : !isInLineApp() 
      ? 'not in LINE app (accessed directly)' 
      : 'standalone mode';
  console.log(`Running in ${reason} without LIFF`);
  renderApp();
}
