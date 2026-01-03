import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import type React from 'react';
import { ThemeProvider } from '@/providers/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pipr | Newborn Care Tracker',
  description: 'Track feeds securely with your family.',
  applicationName: 'Pipr'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
