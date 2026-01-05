'use client';

import React from 'react';
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

const mockTotals = {
  feeds: 6,
  diapers: 4,
  sleepHours: 10
};

const mockHistory = [
  { time: '10:30 AM', type: 'Bottle Feed', detail: '120 mL • Formula' },
  {
    time: '8:15 AM',
    type: 'Breastfeed',
    detail: 'Left: 18 min, Right: 15 min'
  },
  { time: '6:00 AM', type: 'Bottle Feed', detail: '100 mL • Breast Milk' }
];

export default function Dashboard() {
  const todayLabel = format(new Date(), 'EEEE, MMM d');
  const { setTheme, resolved } = useTheme();
  const toggleTheme = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-100">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-accent shadow-card">
              <BabyIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Today
              </p>
              <p className="font-semibold text-lg">{todayLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700"
              aria-label="Toggle theme"
            >
              {resolved === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
            <button
              className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700"
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <section className="card p-5 text-slate-900 bg-accent">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold">Breastfeed</p>
              <p className="text-xs text-slate-900/70">Left Side</p>
            </div>
            <div className="w-11 h-6 bg-white/40 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
            </div>
          </div>
          <div className="text-4xl font-bold tracking-tight">00:12:34</div>
          <p className="text-xs mt-2 text-slate-900/80">
            Auto-switch at 20 min
          </p>
          <p className="text-xs text-slate-900/80">
            Auto-stop second side at 20 min
          </p>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
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
                className="card w-full p-4 flex items-center gap-3 text-left text-slate-900 dark:text-slate-50"
              >
                <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-accent">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card mt-5 p-4 text-slate-900 dark:text-slate-50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Today&apos;s Totals
          </p>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-2xl font-bold">{mockTotals.feeds}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Feeds
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{mockTotals.diapers}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Diapers
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{mockTotals.sleepHours}h</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sleep
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              History
            </h3>
            <button className="text-xs text-accent">Filter</button>
          </div>
          <div className="space-y-3">
            {mockHistory.map((item, idx) => (
              <div
                key={idx}
                className="card p-4 text-slate-900 dark:text-slate-50 flex items-start gap-3"
              >
                <BottleIcon className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.time}
                  </p>
                  <p className="font-semibold">{item.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/80 backdrop-blur border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto flex justify-around py-3 text-slate-600 dark:text-slate-300">
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
                <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-accent">
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
