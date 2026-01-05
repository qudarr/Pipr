'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  BabyIcon,
  BottleIcon,
  CalendarIcon,
  HistoryIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon
} from '../ui/icons';
import { useTheme } from '@/providers/theme-provider';
import WelcomeWizard from '../welcome-wizard';

export default function Dashboard() {
  const [showWizard, setShowWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const todayLabel = format(new Date(), 'EEEE, MMM d');
  const { setTheme, resolved } = useTheme();
  const toggleTheme = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setShowWizard(!data.membership);
      }
    } catch (err) {
      console.error('Failed to check user status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWizardComplete = async (babyName: string, birthdate?: string) => {
    try {
      // Create family space
      const familyRes = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${babyName}'s Family` })
      });

      if (!familyRes.ok) throw new Error('Failed to create family');

      // Create baby
      const babyRes = await fetch('/api/babies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: babyName, birthdate })
      });

      if (!babyRes.ok) throw new Error('Failed to create baby');

      setShowWizard(false);
    } catch (err) {
      console.error('Failed to complete wizard:', err);
      alert('Failed to set up your account. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (showWizard) {
    return <WelcomeWizard onComplete={handleWizardComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800 text-accent shadow-card">
              <BabyIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Today
              </p>
              <p className="font-semibold text-lg">{todayLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-800 text-slate-100 hover:bg-slate-700"
              aria-label="Toggle theme"
            >
              {resolved === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
            <button
              className="p-2 rounded-full bg-slate-800 text-slate-100 hover:bg-slate-700"
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <section className="card p-5 text-slate-900 dark:text-slate-50 bg-accent">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold">Breastfeed</p>
              <p className="text-xs text-slate-800/80">Left Side</p>
            </div>
            <div className="w-11 h-6 bg-white/40 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
            </div>
          </div>
          <div className="text-4xl font-bold tracking-tight">00:00:00</div>
          <p className="text-xs mt-2 text-slate-800/90">
            Auto-switch at 20 min
          </p>
          <p className="text-xs text-slate-800/90">
            Auto-stop second side at 20 min
          </p>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Quick Add
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Bottle', icon: <BottleIcon className="w-5 h-5" /> },
              { label: 'Diaper', icon: <CalendarIcon className="w-5 h-5" /> },
              { label: 'Sleep', icon: <MoonIcon className="w-5 h-5" /> },
              { label: 'Pumping', icon: <HistoryIcon className="w-5 h-5" /> }
            ].map((item) => (
              <button
                key={item.label}
                className="card w-full p-4 flex items-center gap-3 text-left bg-slate-800/70 text-slate-50"
              >
                <span className="p-2 rounded-xl bg-slate-900/50 text-accent">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card mt-5 p-4 bg-slate-800/80 text-slate-50">
          <p className="text-sm text-slate-400">Today&apos;s Totals</p>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-slate-400">Feeds</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-slate-400">Diapers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0h</p>
              <p className="text-xs text-slate-400">Sleep</p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">History</h3>
            <button className="text-xs text-accent">Filter</button>
          </div>
          <div className="card p-8 bg-slate-800/70 text-slate-50 text-center">
            <p className="text-slate-400">No events yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Start tracking your baby&apos;s feeds
            </p>
          </div>
        </section>

        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur border-t border-slate-800">
          <div className="max-w-md mx-auto flex justify-around py-3 text-slate-300">
            {[
              {
                label: 'Today',
                href: '/',
                icon: <CalendarIcon className="w-5 h-5" />
              },
              {
                label: 'History',
                href: '/history',
                icon: <HistoryIcon className="w-5 h-5" />
              },
              {
                label: 'Add',
                href: '/add-bottle',
                icon: <BottleIcon className="w-5 h-5" />
              },
              {
                label: 'Settings',
                href: '/settings',
                icon: <SettingsIcon className="w-5 h-5" />
              }
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1 text-sm"
              >
                <span className="p-2 rounded-xl bg-slate-800/80 text-accent">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
