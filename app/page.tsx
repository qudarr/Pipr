'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/views/dashboard';
import WelcomeWorkflow from '@/components/views/welcome';

export default function Home() {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();

        // If user has no family membership, show welcome workflow
        setNeedsSetup(!data.membership);
      } catch (err) {
        console.error('Failed to check setup:', err);
        setNeedsSetup(false);
      }
    }

    checkSetup();
  }, []);

  if (needsSetup === null) {
    return (
      <div className="min-h-screen baby-gradient-light dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-baby-pink border-t-transparent" />
      </div>
    );
  }

  return needsSetup ? <WelcomeWorkflow /> : <Dashboard />;
}
