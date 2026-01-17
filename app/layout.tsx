import './globals.css';
import type { Metadata } from 'next';
import type React from 'react';
import { ThemeProvider } from '@/providers/theme-provider';
import { PWAProvider } from '@/providers/pwa-provider';

export const metadata: Metadata = {
  title: 'Pipr | Newborn Care Tracker',
  description: 'Track feeds securely with your family.',
  applicationName: 'Pipr',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pipr'
  },
  formatDetection: {
    telephone: false
  },
  themeColor: '#ec4899',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pipr" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="font-sans">
        <PWAProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
