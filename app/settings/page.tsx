'use client';

import React, { useState } from 'react';
import {
  SettingsIcon,
  SunIcon,
  MoonIcon,
  BabyIcon,
  CheckIcon,
  HeartIcon,
  CalendarIcon,
  HistoryIcon
} from '@/components/ui/icons';
import { useTheme } from '@/providers/theme-provider';

export default function SettingsPage() {
  const { theme, setTheme, resolved } = useTheme();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyStatus, setBabyStatus] = useState('');

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus('');
    const res = await fetch('/api/family/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail })
    });
    const data = await res.json();
    if (res.ok) {
      setInviteStatus(`✨ Invite sent successfully!`);
      setInviteEmail('');
    } else {
      setInviteStatus(data.error || 'Failed to send invite');
    }
  };

  const addBaby = async (e: React.FormEvent) => {
    e.preventDefault();
    setBabyStatus('');
    const res = await fetch('/api/babies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: babyName })
    });
    const data = await res.json();
    if (res.ok) {
      setBabyStatus('✨ Baby added successfully!');
      setBabyName('');
    } else {
      setBabyStatus(data.error || 'Failed to add baby');
    }
  };

  return (
    <div className="min-h-screen baby-gradient-light dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 p-5 pb-24 max-w-md mx-auto space-y-5">
      <header className="flex items-center gap-3 pt-3">
        <span className="p-3 rounded-2xl baby-gradient shadow-lg">
          <SettingsIcon className="w-6 h-6 text-white" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">
            Preferences
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
        </div>
      </header>

      <section className="card p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-lg">
              Theme
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose your preferred theme
            </p>
          </div>
          <span className="p-3 rounded-2xl bg-baby-yellow/30 dark:bg-baby-yellow/20">
            {resolved === 'dark' ? (
              <MoonIcon className="w-6 h-6 text-baby-yellow" />
            ) : (
              <SunIcon className="w-6 h-6 text-baby-yellow" />
            )}
          </span>
        </div>
        <div className="flex gap-3">
          {['system', 'light', 'dark'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t as any)}
              className={`flex-1 rounded-2xl border-2 px-4 py-3 capitalize font-semibold transition-all ${
                theme === t
                  ? 'border-baby-pink bg-baby-pink/20 dark:bg-baby-pink/10 text-baby-pink shadow-md'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-baby-pink/50 dark:hover:border-baby-pink/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5 space-y-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-baby-blue/30 dark:bg-baby-blue/20">
            <BabyIcon className="w-6 h-6 text-baby-blue" />
          </span>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-lg">
              Add Baby
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Track another little one
            </p>
          </div>
        </div>
        <form onSubmit={addBaby} className="space-y-3">
          <input
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            placeholder="Baby's name"
            className="w-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:border-baby-blue dark:focus:border-baby-blue focus:ring-2 focus:ring-baby-blue/20"
            required
          />
          <button
            type="submit"
            className="w-full rounded-2xl baby-gradient text-white font-bold py-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Save baby ✨
          </button>
          {babyStatus && (
            <p
              className={`text-sm font-semibold ${babyStatus.includes('✨') ? 'text-baby-mint' : 'text-red-500'}`}
            >
              {babyStatus}
            </p>
          )}
        </form>
      </section>

      <section className="card p-5 space-y-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-baby-peach/30 dark:bg-baby-peach/20">
            <HeartIcon className="w-6 h-6 text-baby-peach" />
          </span>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-lg">
              Partner Invite
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Share access with your partner
            </p>
          </div>
        </div>
        <form onSubmit={sendInvite} className="space-y-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="partner@email.com"
            className="w-full rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:border-baby-peach dark:focus:border-baby-peach focus:ring-2 focus:ring-baby-peach/20"
            required
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-baby-peach hover:bg-baby-peach/90 text-white font-bold py-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Send invite
          </button>
          {inviteStatus && (
            <p
              className={`text-sm font-semibold ${inviteStatus.includes('✨') ? 'text-baby-mint' : 'text-red-500'}`}
            >
              {inviteStatus}
            </p>
          )}
        </form>
      </section>

      <section className="card p-5 border-2 border-dashed border-slate-400 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-baby-lavender/20">
            <CheckIcon className="w-5 h-5 text-baby-lavender" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold">
            Growth tracking coming soon! 📊
          </p>
        </div>
      </section>

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
            href="/stats"
            className="flex flex-col items-center gap-1.5 text-sm group"
          >
            <span className="p-2 rounded-2xl bg-teal-500/20 dark:bg-teal-500/10 text-teal-500 group-hover:bg-teal-500/30 transition-all">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Stats
            </span>
          </a>
          <a
            href="/settings"
            className="flex flex-col items-center gap-1.5 text-sm group"
          >
            <span className="p-2 rounded-2xl bg-baby-lavender/30 dark:bg-baby-lavender/20 text-baby-lavender">
              <SettingsIcon className="w-5 h-5" />
            </span>
            <span className="font-semibold text-baby-lavender">Settings</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
