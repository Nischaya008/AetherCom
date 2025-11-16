import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Workbox will handle service worker registration via Vite PWA plugin
    // But we can also manually register if needed
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegistered(r) {
          console.log('Service Worker registered:', r);
        },
        onRegisterError(error) {
          console.error('Service Worker registration error:', error);
        }
      });
    }).catch(() => {
      console.log('Service Worker registration skipped (dev mode)');
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
