'use client';

import { useEffect } from 'react';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Every minute
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_REQUESTED') {
          console.log('[PWA] Sync requested by service worker');
          // The sync manager will handle this
        }
      });
    }

    // Listen for app install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      console.log('[PWA] Install prompt available');
      
      // You could show a custom install button here
      // For now, the browser will handle it
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
    });

    // Handle iOS standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      console.log('[PWA] Running in standalone mode');
    }
  }, []);

  return <>{children}</>;
}
