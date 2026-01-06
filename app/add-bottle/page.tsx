'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BottleIcon,
  CalendarIcon,
  HistoryIcon,
  SettingsIcon
} from '@/components/ui/icons';
import BottleForm from '@/components/bottle-form';

export default function AddBottlePage() {
  const router = useRouter();

  const handleComplete = () => {
    // Redirect to home after saving
    router.push('/');
  };

  return (
    <div className="min-h-screen baby-gradient-light dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950 dark:to-blue-950">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">
        <header className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-baby-blue/30 dark:bg-baby-blue/20">
            <BottleIcon className="w-7 h-7 text-baby-blue" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">
              Quick Add
            </p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Bottle Feed
            </h1>
          </div>
        </header>

        <BottleForm onComplete={handleComplete} />

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-300 dark:border-slate-700 shadow-2xl">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <a
              href="/"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-baby-pink/20 dark:bg-baby-pink/10 text-baby-pink group-hover:bg-baby-pink/30 transition-all">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Today
              </span>
            </a>
            <a
              href="/history"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-baby-blue/20 dark:bg-baby-blue/10 text-baby-blue group-hover:bg-baby-blue/30 transition-all">
                <HistoryIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                History
              </span>
            </a>
            <a
              href="/settings"
              className="flex flex-col items-center gap-1.5 text-sm group"
            >
              <span className="p-2 rounded-2xl bg-baby-lavender/20 dark:bg-baby-lavender/10 text-baby-lavender group-hover:bg-baby-lavender/30 transition-all">
                <SettingsIcon className="w-5 h-5" />
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Settings
              </span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
